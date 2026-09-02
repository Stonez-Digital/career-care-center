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

function clientIp(req: Request) {
  const value = req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-real-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",")[0];
  const ip = value?.trim() ?? "";
  return ip.length > 0 && ip.length <= 45 ? ip : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Server authentication is unavailable." }, 503);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: caller, error: callerError } = await adminClient.auth.getUser(authHeader.slice(7));
    if (callerError || !caller.user?.email) return json({ error: "Authentication required." }, 401);

    const body = await req.json().catch(() => ({})) as { portal?: unknown };
    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name, role")
      .eq("id", caller.user.id)
      .maybeSingle();
    const isAdmin = ["admin", "super_admin"].includes(profile?.role ?? "")
      && caller.user.app_metadata?.role === profile?.role;
    const portal = body.portal === "admin" && isAdmin ? "admin" : "user";

    const keyBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(caller.user.id));
    const clientKey = Array.from(new Uint8Array(keyBytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const { data: allowed, error: limitError } = await adminClient.rpc("consume_edge_request_limit", {
      requested_scope: "login_activity",
      requested_client_key: clientKey,
      requested_limit: 60,
      requested_window_seconds: 86_400,
    });
    if (limitError || !allowed) return json({ error: "Login activity rate limit reached." }, 429);

    await adminClient.from("login_activity").delete().lt("created_at", new Date(Date.now() - 90 * 86_400_000).toISOString());

    const { error: insertError } = await adminClient.from("login_activity").insert({
      user_id: caller.user.id,
      email: caller.user.email,
      full_name: profile?.full_name ?? caller.user.user_metadata?.full_name ?? null,
      role: profile?.role ?? null,
      portal,
      ip_address: clientIp(req),
      user_agent: (req.headers.get("user-agent") ?? "").slice(0, 512) || null,
    });
    if (insertError) {
      console.error("[record-login] Insert failed:", insertError.message);
      return json({ error: "Could not record login activity." }, 500);
    }

    return json({ success: true }, 201);
  } catch (error) {
    console.error("[record-login] Failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Could not record login activity." }, 500);
  }
});
