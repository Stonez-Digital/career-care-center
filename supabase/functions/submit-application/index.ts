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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Service configuration error." }, 503);

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(authHeader.slice(7));
      userId = data.user?.id ?? null;
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }

    const value = (key: string) => String(body[key] ?? "").trim();
    const fullName = value("full_name");
    const email = value("email").toLowerCase();
    const phone = value("phone");
    const programId = value("program_id");
    const motivation = value("motivation");
    const errors: string[] = [];

    if (!fullName) errors.push("Full name is required.");
    if (!EMAIL_RE.test(email)) errors.push("A valid email is required.");
    if (!phone) errors.push("Phone number is required.");
    if (!programId) errors.push("Programme is required.");
    if (!motivation) errors.push("Motivation statement is required.");
    if (fullName.length > 200) errors.push("Full name must be under 200 characters.");
    if (email.length > 254) errors.push("Email must be under 254 characters.");
    if (phone.length > 30) errors.push("Phone number must be under 30 characters.");
    if (motivation.length > 3000) errors.push("Motivation must be under 3000 characters.");
    if (errors.length) return json({ error: errors.join(" ") }, 422);

    let duplicateQuery = supabase
      .from("applications")
      .select("id, status")
      .eq("program_id", programId);
    duplicateQuery = userId
      ? duplicateQuery.eq("user_id", userId)
      : duplicateQuery.eq("email", email);
    const { data: existing, error: duplicateError } = await duplicateQuery.maybeSingle();
    if (duplicateError) return json({ error: "Unable to validate this application. Please try again." }, 500);
    if (existing) {
      return json({ error: `You have already applied for this programme (status: ${existing.status}).` }, 409);
    }

    const optional = (key: string, max: number) => value(key).slice(0, max) || null;
    const { data: application, error: insertError } = await supabase
      .from("applications")
      .insert({
        user_id: userId,
        full_name: fullName.slice(0, 200),
        email,
        phone: phone.slice(0, 30),
        gender: optional("gender", 50),
        date_of_birth: optional("date_of_birth", 10),
        institution: optional("institution", 300),
        occupation: optional("occupation", 200),
        program_id: programId,
        motivation: motivation.slice(0, 3000),
        status: "pending",
      })
      .select("id, status")
      .single();

    if (insertError) {
      console.error("[submit-application] Insert error:", insertError.message);
      return json({ error: "Failed to submit application. Please try again." }, 500);
    }

    const { error: logError } = await supabase.from("application_status_logs").insert({
      application_id: application.id,
      status: "pending",
      changed_by: userId,
      note: "Application submitted",
    });
    if (logError) console.warn("[submit-application] Status log error:", logError.message);

    return json({
      success: true,
      application_id: application.id,
      message: "Application submitted successfully.",
    });
  } catch (error) {
    console.error("[submit-application] Unexpected error:", error);
    return json({ error: "An unexpected error occurred." }, 500);
  }
});
