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

function fetchAuth(input, init) {
  const url = typeof input === "string" ? input : input?.url || "";
  if (!String(url).includes("/auth/v1/token")) return fetch(input, init);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  if (init?.signal) {
    if (init.signal.aborted) controller.abort();
    else init.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export function loadStoredAuthUser() {
  if (!supabaseUrl || typeof localStorage === "undefined") return null;
  try {
    const ref = new URL(supabaseUrl).hostname.split(".")[0];
    const session = JSON.parse(localStorage.getItem(`sb-${ref}-auth-token`) || "null");
    if (!session?.user?.id || !session?.refresh_token) return null;
    return { user: session.user, expiresAt: Number(session.expires_at) || 0 };
  } catch {
    return null;
  }
}

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: { fetch: fetchAuth },
    })
  : null;
