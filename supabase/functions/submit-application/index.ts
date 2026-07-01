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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // Require auth — only authenticated users can apply
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Verify the JWT and get the user
    const token = authHeader.slice(7);
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return json({ error: "Invalid or expired session. Please sign in again." }, 401);
    }
    const userId = userData.user.id;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const { program_id, motivation, experience, availability, emergency_contact } = body as Record<string, string>;

    const errors: string[] = [];
    if (!program_id?.trim()) errors.push("Programme is required.");
    if (!motivation?.trim()) errors.push("Motivation statement is required.");
    if (motivation?.trim().length > 3000) errors.push("Motivation must be under 3000 characters.");
    if (errors.length) return json({ error: errors.join(" ") }, 422);

    // Prevent duplicate applications for the same program
    const { data: existing } = await supabase
      .from("applications")
      .select("id, status")
      .eq("user_id", userId)
      .eq("program_id", program_id)
      .maybeSingle();

    if (existing) {
      return json({
        error: `You have already applied for this programme (status: ${existing.status}). You cannot apply twice.`,
      }, 409);
    }

    const { data: application, error: insertError } = await supabase
      .from("applications")
      .insert({
        user_id: userId,
        program_id: program_id.trim(),
        motivation: motivation.trim().slice(0, 3000),
        experience: experience?.trim().slice(0, 3000) ?? null,
        availability: availability?.trim().slice(0, 500) ?? null,
        emergency_contact: emergency_contact?.trim().slice(0, 200) ?? null,
        status: "pending",
      })
      .select("id, status")
      .single();

    if (insertError) {
      console.error("[submit-application] Insert error:", insertError.message);
      return json({ error: "Failed to submit application. Please try again." }, 500);
    }

    // Log status
    await supabase.from("application_status_logs").insert({
      application_id: application.id,
      status: "pending",
      changed_by: userId,
      note: "Application submitted",
    }).throwOnError().catch((e: Error) => console.warn("[submit-application] status log:", e.message));

    console.log(`[submit-application] Application ${application.id} submitted by ${userId}`);
    return json({
      success: true,
      application_id: application.id,
      message: "Application submitted successfully. We will review it and get back to you.",
    });
  } catch (err) {
    console.error("[submit-application] Unexpected error:", err);
    return json({ error: "An unexpected error occurred." }, 500);
  }
});
