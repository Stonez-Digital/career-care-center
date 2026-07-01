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

const VALID_CURRENCIES = ["NGN", "USD", "GBP", "EUR"];
const VALID_FREQUENCIES = ["one_time", "monthly", "yearly"];

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

    const {
      donor_name, donor_email, donor_phone, organization,
      amount, currency = "NGN", frequency = "one_time",
      message, is_anonymous = false,
    } = body as Record<string, unknown>;

    const errors: string[] = [];
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) errors.push("Amount must be greater than 0.");
    if (numAmount > 100_000_000) errors.push("Amount exceeds maximum allowed.");
    if (!VALID_CURRENCIES.includes(String(currency))) errors.push(`Currency must be one of: ${VALID_CURRENCIES.join(", ")}.`);
    if (!VALID_FREQUENCIES.includes(String(frequency))) errors.push(`Frequency must be one of: ${VALID_FREQUENCIES.join(", ")}.`);

    if (!is_anonymous) {
      if (!String(donor_name ?? "").trim()) errors.push("Donor name is required for identified donations.");
      if (!String(donor_email ?? "").trim() || !String(donor_email).includes("@")) {
        errors.push("Valid donor email is required for identified donations.");
      }
    }

    if (errors.length) return json({ error: errors.join(" ") }, 422);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const payload: Record<string, unknown> = {
      amount: numAmount,
      currency: String(currency),
      frequency: String(frequency),
      message: String(message ?? "").trim().slice(0, 2000) || null,
      status: "pending",
      is_anonymous: Boolean(is_anonymous),
    };

    if (is_anonymous) {
      payload.donor_name = "Anonymous";
      payload.donor_email = null;
      payload.donor_phone = null;
      payload.organization = null;
    } else {
      payload.donor_name = String(donor_name).trim().slice(0, 200);
      payload.donor_email = String(donor_email).trim().toLowerCase().slice(0, 254);
      payload.donor_phone = donor_phone ? String(donor_phone).trim().slice(0, 20) : null;
      payload.organization = organization ? String(organization).trim().slice(0, 200) : null;
    }

    const { data: donation, error: insertError } = await supabase
      .from("donations")
      .insert(payload)
      .select("id, amount, currency, is_anonymous")
      .single();

    if (insertError) {
      console.error("[process-donation] Insert error:", insertError.message);
      return json({ error: "Failed to record donation. Please try again." }, 500);
    }

    console.log(`[process-donation] Donation ${donation.id} recorded — ₦${numAmount} (${is_anonymous ? "anonymous" : donor_email})`);
    return json({
      success: true,
      donation_id: donation.id,
      message: is_anonymous
        ? "Thank you for your anonymous donation. Your generosity is greatly appreciated."
        : `Thank you for your donation of ${currency} ${numAmount.toLocaleString()}.`,
    });
  } catch (err) {
    console.error("[process-donation] Unexpected error:", err);
    return json({ error: "An unexpected error occurred." }, 500);
  }
});
