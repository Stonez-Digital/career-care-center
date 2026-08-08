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
const DEFAULT_SITE_URL = "https://app.careercarecenter.com.ng";

function getSiteUrl() {
  const configuredUrl = Deno.env.get("SITE_URL")?.trim() || DEFAULT_SITE_URL;
  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "https:") throw new Error("SITE_URL must use HTTPS");
    return url.origin;
  } catch {
    console.error("[process-donation] SITE_URL is invalid; using the production fallback");
    return DEFAULT_SITE_URL;
  }
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

    // Initialize Paystack transaction
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) {
      console.error("[process-donation] PAYSTACK_SECRET_KEY not configured");
      return json({
        success: true,
        donation_id: donation.id,
        message: "Donation recorded. Payment gateway not configured — you will be contacted to complete payment.",
      });
    }

    const paystackPayload = {
      email: is_anonymous ? "anonymous@careercarecenter.com" : String(donor_email).trim().toLowerCase(),
      amount: Math.round(numAmount * 100), // Paystack expects amount in kobo
      currency: String(currency),
      reference: `CCC-${donation.id}`,
      callback_url: `${getSiteUrl()}/donate?status=success&ref=CCC-${donation.id}`,
      metadata: {
        donation_id: donation.id,
        donor_name: is_anonymous ? "Anonymous" : String(donor_name).trim(),
        frequency: String(frequency),
        custom_fields: [
          { display_name: "Donation ID", variable_name: "donation_id", value: donation.id },
          { display_name: "Frequency", variable_name: "frequency", value: String(frequency) },
        ],
      },
    };

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      console.error("[process-donation] Paystack init failed:", JSON.stringify(paystackData));
      return json({
        success: true,
        donation_id: donation.id,
        message: "Donation recorded. Payment initialization failed — you will be contacted to complete payment.",
      });
    }

    console.log(`[process-donation] Donation ${donation.id} recorded — ₦${numAmount} (${is_anonymous ? "anonymous" : donor_email}). Paystack authorization URL generated.`);

    return json({
      success: true,
      donation_id: donation.id,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
      message: is_anonymous
        ? "Thank you for your anonymous donation. Your generosity is greatly appreciated."
        : `Thank you for your donation of ${currency} ${numAmount.toLocaleString()}.`,
    });
  } catch (err) {
    console.error("[process-donation] Unexpected error:", err);
    return json({ error: "An unexpected error occurred." }, 500);
  }
});
