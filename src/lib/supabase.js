import { createClient } from "@supabase/supabase-js";

function readEnv(...keys) {
  for (const key of keys) {
    const value = import.meta.env[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export const supabaseUrl = readEnv("VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
export const supabaseAnonKey = readEnv("VITE_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
