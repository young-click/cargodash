import { createClient } from "@supabase/supabase-js";

// Fallback credentials if environment variables are not set or gitignored on Render
const DEFAULT_SUPABASE_URL = "https://xypwuwvtpdjgqayzmjeo.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_8-m1rppd0T-GhSmgo0_nVw_eL3Cx2G2";

let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();

// Auto-correct common typo .supabase.com -> .supabase.co
if (rawUrl.includes(".supabase.com")) {
  rawUrl = rawUrl.replace(".supabase.com", ".supabase.co");
}
// Strip any trailing slash or accidental wrapping quotes
rawUrl = rawUrl.replace(/^["']|["']$/g, "").replace(/\/+$/, "");

let rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();
rawKey = rawKey.replace(/^["']|["']$/g, "");

export const supabase = createClient(rawUrl, rawKey);

export default supabase;
