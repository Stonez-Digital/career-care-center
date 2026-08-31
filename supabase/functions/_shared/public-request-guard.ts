import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const MAX_BODY_BYTES = 16 * 1024;

export async function readBoundedJson(req: Request): Promise<Record<string, unknown>> {
  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new Error("request_too_large");
  }
  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new Error("request_too_large");
  }
  return JSON.parse(raw) as Record<string, unknown>;
}

function clientAddress(req: Request) {
  return req.headers.get("cf-connecting-ip")?.trim()
    || req.headers.get("x-real-ip")?.trim()
    || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "";
}

export async function enforceRateLimit(
  req: Request,
  supabase: SupabaseClient,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  const address = clientAddress(req);
  const pepper = Deno.env.get("PUBLIC_RATE_LIMIT_PEPPER") ?? "";
  if (!address || pepper.length < 32) throw new Error("rate_limit_unavailable");

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${scope}:${address}:${pepper}`),
  );
  const clientKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const { data, error } = await supabase.rpc("consume_edge_request_limit", {
    requested_scope: scope,
    requested_client_key: clientKey,
    requested_limit: limit,
    requested_window_seconds: windowSeconds,
  });
  if (error) throw new Error("rate_limit_unavailable");
  if (data !== true) return false;

  // A global ceiling makes provider/database work bounded even if an
  // upstream proxy ever permits spoofing of the client-address header.
  const globalDigest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${scope}:global:${pepper}`),
  );
  const globalKey = Array.from(new Uint8Array(globalDigest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const { data: globalAllowed, error: globalError } = await supabase.rpc("consume_edge_request_limit", {
    requested_scope: `${scope}-global`,
    requested_client_key: globalKey,
    requested_limit: limit * 20,
    requested_window_seconds: windowSeconds,
  });
  if (globalError) throw new Error("rate_limit_unavailable");
  return globalAllowed === true;
}
