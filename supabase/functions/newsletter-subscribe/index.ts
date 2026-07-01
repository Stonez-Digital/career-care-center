import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const email = String(body.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return json({ error: "Please enter a valid email address." }, 422);
    if (email.length > 254) return json({ error: "Email address is too long." }, 422);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Check for existing subscriber
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      if (existing.is_active) {
        return json({ success: true, message: "You are already subscribed to our newsletter." });
      }
      // Reactivate
      await supabase.from("newsletter_subscribers").update({ is_active: true }).eq("id", existing.id);
      console.log(`[newsletter] Reactivated: ${email}`);
      return json({ success: true, message: "Welcome back! Your subscription has been reactivated." });
    }

    const { error: insertError } = await supabase.from("newsletter_subscribers").insert({
      email,
      is_active: true,
    });

    if (insertError) {
      console.error("[newsletter] Insert error:", insertError.message);
      return json({ error: "Failed to subscribe. Please try again." }, 500);
    }

    console.log(`[newsletter] New subscriber: ${email}`);
    return json({ success: true, message: "Thank you for subscribing to our newsletter!" });
  } catch (err) {
    console.error("[newsletter] Unexpected error:", err);
    return json({ error: "An unexpected error occurred." }, 500);
  }
});
