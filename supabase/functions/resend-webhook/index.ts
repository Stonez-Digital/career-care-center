import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@6.9.1";

function response(status: number, message: string) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function plainTextFromHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return response(405, "Method not allowed");

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return response(503, "Webhook verification is not configured");
  }

  const payload = await req.text();
  let event: Record<string, unknown>;
  try {
    const resend = new Resend(apiKey);
    event = await resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    }) as Record<string, unknown>;
  } catch {
    return response(400, "Invalid webhook signature");
  }

  const type = String(event.type ?? "");
  if (!["email.sent", "email.delivered", "email.bounced", "email.complained", "email.received"].includes(type)) {
    return response(200, "Event ignored");
  }

  const data = event.data as Record<string, unknown> | undefined;
  const emailId = String(data?.email_id ?? data?.id ?? "");
  if (!emailId) return response(200, "Event without email ID ignored");

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  if (type === "email.received") {
    const recipients = Array.isArray(data?.to) ? data.to.map(String) : [];
    const route = recipients
      .map((recipient) => recipient.match(/^contact-([0-9a-f-]{36})@/i))
      .find((match) => match);
    if (!route) return response(200, "Received email is not a contact reply");

    const contactMessageId = route[1];
    const senderEmail = String(data?.from ?? "").trim().toLowerCase();
    const { data: contactMessage, error: contactError } = await supabase
      .from("contact_messages")
      .select("id, email")
      .eq("id", contactMessageId)
      .maybeSingle();
    if (contactError) return response(500, "Could not locate contact conversation");
    if (!contactMessage || contactMessage.email.trim().toLowerCase() !== senderEmail) {
      console.warn("[resend-webhook] Ignored inbound sender that does not match the contact message");
      return response(200, "Inbound sender does not match contact conversation");
    }

    const receivedResponse = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!receivedResponse.ok) {
      console.error("[resend-webhook] Could not retrieve received email:", receivedResponse.status);
      return response(502, "Could not retrieve received email");
    }
    const received = await receivedResponse.json() as Record<string, unknown>;
    const bodyText = String(received.text ?? "").trim() || plainTextFromHtml(String(received.html ?? ""));
    if (!bodyText) return response(422, "Received email has no readable body");

    const receivedAt = String(received.created_at ?? event.created_at ?? new Date().toISOString());
    const { error: insertError } = await supabase.from("contact_message_replies").upsert({
      contact_message_id: contactMessageId,
      direction: "inbound",
      provider_message_id: emailId,
      sender_email: senderEmail,
      recipient_email: recipients.join(", "),
      subject: String(received.subject ?? data?.subject ?? ""),
      body_text: bodyText.slice(0, 50000),
      received_at: receivedAt,
      created_at: receivedAt,
    }, { onConflict: "provider_message_id", ignoreDuplicates: true });
    if (insertError) {
      console.error("[resend-webhook] Inbound reply audit failed:", insertError.message);
      return response(500, "Inbound reply audit failed");
    }
    const { error: unreadError } = await supabase
      .from("contact_messages")
      .update({ status: "unread" })
      .eq("id", contactMessageId);
    if (unreadError) return response(500, "Could not flag inbound reply as unread");
    return response(200, "Inbound reply stored");
  }

  const deliveryStatus = type.replace("email.", "");
  const update: Record<string, unknown> = { reply_delivery_status: deliveryStatus };
  if (type === "email.delivered") {
    update.status = "replied";
    update.reply_delivered_at = event.created_at ?? new Date().toISOString();
  }

  const { error } = await supabase
    .from("contact_messages")
    .update(update)
    .eq("reply_message_id", emailId);
  if (error) {
    console.error("[resend-webhook] Delivery audit update failed:", error.message);
    return response(500, "Delivery audit update failed");
  }

  return response(200, "Webhook processed");
});
