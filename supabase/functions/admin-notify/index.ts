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

type EventType = "application" | "donation" | "contact" | "newsletter" | "volunteer" | "testimonial";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // Only allow internal calls (service role key required in Authorization)
    const authHeader = req.headers.get("Authorization") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!serviceKey || token !== serviceKey) {
      return json({ error: "Unauthorized" }, 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const { event_type, title, details } = body as { event_type: EventType; title: string; details: string };
    const allowedTypes = new Set<EventType>(["application", "donation", "contact", "newsletter", "volunteer", "testimonial"]);
    if (!allowedTypes.has(event_type) || typeof title !== "string" || !title.trim()) {
      return json({ error: "A valid event_type and title are required." }, 422);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceKey,
      { auth: { persistSession: false } }
    );

    // Find all admin users
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "super_admin"]);

    if (!admins?.length) {
      console.warn("[admin-notify] No admins found.");
      return json({ success: true, message: "No admins to notify." });
    }

    const notifications = admins.map((admin: { id: string }) => ({
      user_id: admin.id,
      title: `[Admin] ${title.trim().slice(0, 200)}`,
      body: typeof details === "string" ? details.trim().slice(0, 2000) : title.trim().slice(0, 2000),
      type: event_type,
    }));

    const { error } = await supabase.from("notifications").insert(notifications);
    if (error) {
      console.error("[admin-notify] Insert error:", error.message);
      return json({ error: "Failed to send notifications." }, 500);
    }

    console.log(`[admin-notify] Notified ${admins.length} admin(s) of ${event_type}: ${title}`);
    return json({ success: true, notified: admins.length });
  } catch (err) {
    console.error("[admin-notify] Unexpected error:", err);
    return json({ error: "An unexpected error occurred." }, 500);
  }
});
