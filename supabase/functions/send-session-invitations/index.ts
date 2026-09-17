import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromAddress = Deno.env.get("SESSION_INVITATION_FROM") ??
    "Career Care Center <info@careercarecenter.com.ng>";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Server authentication is unavailable." }, 503);
  }
  if (!resendApiKey) {
    return json({ error: "Email delivery is not configured." }, 503);
  }

  const bearer = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!bearer) return json({ error: "Authentication required." }, 401);

  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(bearer);
  if (authError || !authData.user) return json({ error: "Invalid session." }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: adminProfile } = await adminClient
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (!adminProfile || adminProfile.is_suspended || !["admin", "super_admin"].includes(adminProfile.role)) {
    return json({ error: "Administrator access required." }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }
  const requestedSessionIds = Array.isArray(body.session_ids)
    ? body.session_ids.map(String)
    : [String(body.session_id ?? "")];
  const sessionIds = [...new Set(requestedSessionIds)];
  if (sessionIds.length === 0 || sessionIds.length > 100 || sessionIds.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) {
    return json({ error: "Invalid session IDs." }, 422);
  }

  const { data: sessions, error: sessionError } = await adminClient
    .from("mentor_sessions")
    .select("id, topic, scheduled_at, meeting_url, notes, status, mentor:profiles!mentor_sessions_mentor_id_fkey(full_name, email), mentee:profiles!mentor_sessions_mentee_id_fkey(full_name, email)")
    .in("id", sessionIds);
  if (sessionError) return json({ error: "Could not load the session." }, 500);
  if (!sessions || sessions.length !== sessionIds.length) return json({ error: "One or more sessions were not found." }, 404);
  const session = sessions[0];
  if (sessions.some((item) => item.status !== "scheduled" || !item.meeting_url)) {
    return json({ error: "Only scheduled sessions with a meeting link can be emailed." }, 422);
  }

  const participants = [session.mentor, ...sessions.map((item) => item.mentee)].flat().filter(
    (participant): participant is { full_name: string | null; email: string } => Boolean(participant?.email),
  );
  const uniqueParticipants = [...new Map(participants.map((participant) => [participant.email, participant])).values()];
  if (uniqueParticipants.length !== sessions.length + 1) return json({ error: "All participant email addresses are required." }, 422);

  const when = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(session.scheduled_at));
  const safeTopic = escapeHtml(session.topic);
  const safeWhen = escapeHtml(when);
  const safeUrl = escapeHtml(session.meeting_url);
  const safeNotes = session.notes ? escapeHtml(session.notes).replaceAll("\n", "<br />") : "";

  const results = await Promise.all(uniqueParticipants.map(async (participant, index) => {
    const name = participant.full_name?.trim() || "there";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `session-invitation/${sessionIds.join("-")}/${index}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [participant.email],
        subject: `Microsoft Teams session: ${session.topic}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:640px;margin:auto"><p>Hello ${escapeHtml(name)},</p><p>You have been scheduled for a Career Care Center mentorship session.</p><p><strong>Topic:</strong> ${safeTopic}<br><strong>Date and time:</strong> ${safeWhen} (West Africa Time)</p>${safeNotes ? `<p><strong>Notes:</strong><br>${safeNotes}</p>` : ""}<p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#17358f;color:#fff;text-decoration:none;border-radius:6px">Join Microsoft Teams meeting</a></p><p>If the button does not work, use this link:<br><a href="${safeUrl}">${safeUrl}</a></p><p>Kind regards,<br><strong>Career Care Center for Youth Development Initiative</strong></p></div>`,
        text: `Hello ${name},\n\nYou have been scheduled for a Career Care Center mentorship session.\n\nTopic: ${session.topic}\nDate and time: ${when} (West Africa Time)${session.notes ? `\nNotes: ${session.notes}` : ""}\n\nJoin Microsoft Teams: ${session.meeting_url}\n\nKind regards,\nCareer Care Center for Youth Development Initiative`,
      }),
    });
    const result = await response.json() as { id?: string; message?: string };
    return { ok: response.ok && Boolean(result.id), id: result.id, message: result.message };
  }));

  if (results.some((result) => !result.ok)) {
    console.error("[send-session-invitations] Resend rejected an invitation:", results);
    return json({ error: "The email provider did not accept all participant invitations." }, 502);
  }

  return json({ success: true, sent: results.length, message_ids: results.map((result) => result.id) });
});
