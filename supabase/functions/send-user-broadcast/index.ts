import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("USER_BROADCAST_FROM")
      ?? "Career Care Center <info@careercarecenter.com.ng>";
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Server authentication is unavailable." }, 503);
    if (!resendApiKey) return json({ error: "Email delivery is not configured." }, 503);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: caller, error: callerError } = await adminClient.auth.getUser(authHeader.slice(7));
    if (callerError || !caller.user) return json({ error: "Administrator access required." }, 403);

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", caller.user.id)
      .maybeSingle();
    const callerRole = callerProfile?.role;
    if (
      !callerProfile
      || callerProfile.is_suspended
      || !["admin", "super_admin"].includes(callerRole)
      || caller.user.app_metadata?.role !== callerRole
    ) {
      return json({ error: "Administrator access required." }, 403);
    }

    const declaredLength = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > 16 * 1024) {
      return json({ error: "Request body is too large." }, 413);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();
    const requestId = String(body.request_id ?? "").trim();
    if (!subject || subject.length > 150) return json({ error: "Subject must be between 1 and 150 characters." }, 422);
    if (!message || message.length > 10_000) return json({ error: "Message must be between 1 and 10,000 characters." }, 422);
    if (!UUID_RE.test(requestId)) return json({ error: "A valid request ID is required." }, 422);

    const recipients = new Map<string, string>();
    for (let offset = 0; offset < 5_000; offset += 500) {
      const { data: profiles, error: profileError } = await adminClient
        .from("profiles")
        .select("full_name, email")
        .order("id")
        .range(offset, offset + 499);
      if (profileError) return json({ error: "Could not load user email addresses." }, 500);
      for (const profile of profiles ?? []) {
        const email = String(profile.email ?? "").trim().toLowerCase();
        if (EMAIL_RE.test(email)) recipients.set(email, String(profile.full_name ?? "").trim());
      }
      if ((profiles?.length ?? 0) < 500) break;
      if (offset === 4_500) return json({ error: "The recipient limit for one broadcast was exceeded." }, 422);
    }
    if (!recipients.size) return json({ error: "No user email addresses are available." }, 422);

    const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");
    const messages = Array.from(recipients, ([email, name]) => ({
      from: fromAddress,
      to: [email],
      subject,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.65;color:#172033;max-width:640px;margin:auto"><p>Hello ${escapeHtml(name || "there")},</p><p>${safeMessage}</p><p>Kind regards,<br><strong>Career Care Center for Youth Development Initiative</strong></p></div>`,
      text: `Hello ${name || "there"},\n\n${message}\n\nKind regards,\nCareer Care Center for Youth Development Initiative`,
    }));

    let sent = 0;
    for (let index = 0; index < messages.length; index += 100) {
      const response = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `user-broadcast/${requestId}/${index / 100}`,
        },
        body: JSON.stringify(messages.slice(index, index + 100)),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { message?: string };
        console.error("[send-user-broadcast] Resend rejected a batch:", response.status, result.message);
        return json({ error: `Email delivery stopped after ${sent} recipients.`, sent }, 502);
      }
      sent += Math.min(100, messages.length - index);
    }

    return json({ success: true, sent });
  } catch (error) {
    console.error("[send-user-broadcast] Failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Unable to send the broadcast email." }, 500);
  }
});
