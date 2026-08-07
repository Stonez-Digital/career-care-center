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

function hasServiceRole(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  try {
    const segment = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(segment.padEnd(Math.ceil(segment.length / 4) * 4, "=")));
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!serviceRoleKey || !supabaseUrl) {
      console.error("[welcome-email] Required Supabase environment is unavailable");
      return json({ error: "Service temporarily unavailable" }, 503);
    }

    if (!hasServiceRole(req)) {
      return json({ error: "Unauthorized" }, 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const { user_id, email, full_name, role } = body as Record<string, string>;
    if (!user_id || !email) return json({ error: "user_id and email are required." }, 422);

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    // Create an in-app welcome notification
    const { error } = await supabase.from("notifications").insert({
      user_id,
      title: "Welcome to Career Care Center!",
      body: `Hi ${full_name ?? "there"}, welcome to the CCC community! Your ${role ?? "account"} account is now active. Explore programmes, connect with mentors, and start your journey.`,
      type: "welcome",
    });

    if (error) {
      console.error("[welcome-email] Notification insert error:", error.message);
      return json({ error: "Failed to deliver welcome notification." }, 500);
    }

    console.log("[welcome-email] Welcome notification delivered");
    return json({ success: true, message: "Welcome notification delivered." });
  } catch (err) {
    console.error("[welcome-email] Unexpected error:", err);
    return json({ error: "An unexpected error occurred." }, 500);
  }
});
