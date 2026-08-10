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
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromAddress = Deno.env.get("CONTACT_REPLY_FROM") ??
    "Career Care Center <info@careercarecenter.com.ng>";
  const receivingDomain = Deno.env.get("CONTACT_REPLY_RECEIVING_DOMAIN")?.trim().toLowerCase();

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Server authentication is unavailable." }, 503);
  }
  if (!resendApiKey) {
    return json({ error: "Email delivery is not configured. Add RESEND_API_KEY to Supabase secrets." }, 503);
  }

  const bearer = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!bearer) return json({ error: "Authentication required." }, 401);

  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(bearer);
  if (authError || !authData.user) return json({ error: "Invalid session." }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (!profile || profile.is_suspended || !["admin", "super_admin"].includes(profile.role)) {
    return json({ error: "Administrator access required." }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const messageId = String(body.message_id ?? "");
  const reply = String(body.reply ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(messageId)) return json({ error: "Invalid message ID." }, 422);
  if (!reply || reply.length > 5000) return json({ error: "Reply must contain 1 to 5000 characters." }, 422);
  const replyTo = receivingDomain
    ? `contact-${messageId}@${receivingDomain}`
    : (Deno.env.get("CONTACT_REPLY_TO") ?? "info@careercarecenter.com.ng");

  const { data: message, error: messageError } = await adminClient
    .from("contact_messages")
    .select("id, name, email, subject, reply_message_id, reply_delivery_status")
    .eq("id", messageId)
    .maybeSingle();
  if (messageError) return json({ error: "Could not load the contact message." }, 500);
  if (!message) return json({ error: "Contact message not found." }, 404);
  if (message.reply_message_id) {
    return json({ error: "A reply has already been sent for this message." }, 409);
  }

  const safeName = escapeHtml(message.name || "there");
  const safeReply = escapeHtml(reply).replaceAll("\n", "<br />");
  const subject = `Re: ${message.subject?.trim() || "Your message to Career Care Center"}`;
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `contact-reply/${message.id}`,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [message.email],
      reply_to: replyTo,
      subject,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:640px;margin:auto"><p>Hello ${safeName},</p><p>${safeReply}</p><p>Kind regards,<br><strong>Career Care Center for Youth Development Initiative</strong></p></div>`,
      text: `Hello ${message.name || "there"},\n\n${reply}\n\nKind regards,\nCareer Care Center for Youth Development Initiative`,
    }),
  });

  const resendResult = await resendResponse.json() as { id?: string; message?: string };
  if (!resendResponse.ok || !resendResult.id) {
    console.error("[send-contact-reply] Resend rejected the email:", resendResult.message ?? resendResponse.status);
    return json({ error: "The email provider did not accept the reply. No replied status was recorded." }, 502);
  }

  const sentAt = new Date().toISOString();
  const { error: updateError } = await adminClient
    .from("contact_messages")
    .update({
      admin_reply: reply,
      reply_message_id: resendResult.id,
      reply_delivery_status: "sent",
      reply_sent_at: sentAt,
      reply_delivered_at: null,
      replied_by: authData.user.id,
      status: "read",
    })
    .eq("id", message.id);

  if (updateError) {
    console.error("[send-contact-reply] Audit update failed:", updateError.message);
    return json({ error: "Email was accepted, but its audit record could not be saved. Contact support." }, 500);
  }

  const { error: auditError } = await adminClient.from("contact_message_replies").insert({
    contact_message_id: message.id,
    direction: "outbound",
    provider_message_id: resendResult.id,
    sender_email: fromAddress,
    recipient_email: message.email,
    subject,
    body_text: reply,
    created_at: sentAt,
  });
  if (auditError) {
    console.error("[send-contact-reply] Conversation audit insert failed:", auditError.message);
  }

  return json({
    success: true,
    message_id: resendResult.id,
    sent_at: sentAt,
    inbound_replies_enabled: Boolean(receivingDomain),
  });
});
