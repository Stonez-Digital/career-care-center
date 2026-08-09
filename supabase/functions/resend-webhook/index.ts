import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@6.9.1";

function response(status: number, message: string) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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
  if (!["email.sent", "email.delivered", "email.bounced", "email.complained"].includes(type)) {
    return response(200, "Event ignored");
  }

  const data = event.data as Record<string, unknown> | undefined;
  const emailId = String(data?.email_id ?? data?.id ?? "");
  if (!emailId) return response(200, "Event without email ID ignored");

  const deliveryStatus = type.replace("email.", "");
  const update: Record<string, unknown> = { reply_delivery_status: deliveryStatus };
  if (type === "email.delivered") {
    update.status = "replied";
    update.reply_delivered_at = event.created_at ?? new Date().toISOString();
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
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
