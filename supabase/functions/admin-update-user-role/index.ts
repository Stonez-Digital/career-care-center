import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};
const roles = new Set(["super_admin", "admin", "intern", "mentor", "volunteer"]);
const respond = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return respond({ error: "Service configuration error." }, 503);
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return respond({ error: "Authentication required." }, 401);

    const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: caller, error: callerError } = await adminClient.auth.getUser(authHeader.slice(7));
    if (callerError || !caller.user) return respond({ error: "Administrator access required." }, 403);
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", caller.user.id)
      .maybeSingle();
    const callerRole = callerProfile?.role;
    if (!callerProfile || callerProfile.is_suspended || callerRole !== "super_admin" || caller.user.app_metadata?.role !== callerRole) {
      return respond({ error: "Super administrator access required." }, 403);
    }

    const { user_id, role } = await req.json() as { user_id?: string; role?: string };
    if (!user_id || !role || !roles.has(role)) return respond({ error: "Valid user and role are required." }, 422);
    if (user_id === caller.user.id) return respond({ error: "Administrators cannot change their own role." }, 409);

    const { data: target, error: targetError } = await adminClient.auth.admin.getUserById(user_id);
    if (targetError || !target.user) return respond({ error: "User not found." }, 404);
    const appMetadata = { ...target.user.app_metadata, role };
    const { error: authError } = await adminClient.auth.admin.updateUserById(user_id, { app_metadata: appMetadata });
    if (authError) throw authError;
    const { error: profileError } = await adminClient.from("profiles").update({ role }).eq("id", user_id);
    if (profileError) throw profileError;

    return respond({ success: true, role });
  } catch (error) {
    console.error("[admin-update-user-role] Failed:", error instanceof Error ? error.message : "Unknown error");
    return respond({ error: "Unable to update the user role." }, 500);
  }
});
