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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const { name, email, phone, subject, message } = body as Record<string, string>;

    // Input validation
    const errors: string[] = [];
    if (!name?.trim()) errors.push("Name is required.");
    if (!email?.trim() || !email.includes("@")) errors.push("Valid email is required.");
    if (!message?.trim()) errors.push("Message is required.");
    if (message?.trim().length > 5000) errors.push("Message must be under 5000 characters.");
    if (name?.trim().length > 200) errors.push("Name must be under 200 characters.");
    if (errors.length) return json({ error: errors.join(" ") }, 422);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { error: insertError } = await supabase.from("contact_messages").insert({
      name: name.trim().slice(0, 200),
      email: email.trim().toLowerCase().slice(0, 254),
      phone: phone?.trim().slice(0, 20) ?? null,
      subject: subject?.trim().slice(0, 300) ?? null,
      message: message.trim().slice(0, 5000),
      status: "unread",
    });

    if (insertError) {
      console.error("[contact-form] Insert error:", insertError.message);
      return json({ error: "Failed to submit message. Please try again." }, 500);
    }

    // Fan out an in-app notification to active administrators.
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "super_admin"])
      .eq("is_suspended", false);
    if (admins?.length) {
      const { error: notificationError } = await supabase.from("notifications").insert(admins.map(({ id }) => ({
        user_id: id,
        title: "New Contact Message",
        body: `New message from ${name.trim()} (${email.trim()}): ${subject?.trim() || "(no subject)"}`,
        type: "contact",
      })));
      if (notificationError) {
        console.warn("[contact-form] Admin notification failed:", notificationError.message);
      }
    }

    console.log("[contact-form] Message submitted successfully");
    return json({ success: true, message: "Message sent successfully." });
  } catch (err) {
    console.error("[contact-form] Unexpected error:", err);
    return json({ error: "An unexpected error occurred." }, 500);
  }
});
