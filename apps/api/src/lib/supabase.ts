import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw Object.assign(new Error("SupabaseNotConfigured"), { status: 503 });
  }
  cached = createClient(url, key);
  return cached;
}

export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET ?? "siambox-products";
