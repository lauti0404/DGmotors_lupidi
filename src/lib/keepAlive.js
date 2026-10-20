import { supabase, supabaseAnonKey, supabaseConfigured, supabaseUrl } from "./supabase";

const KEY = "dg_supabase_ping";
const DAY = 24 * 60 * 60 * 1000;

function due() {
  const last = Number(localStorage.getItem(KEY) || 0);
  return !last || Date.now() - last > DAY;
}

async function ping(force) {
  if (!navigator.onLine || (!force && !due())) return;
  try {
    if (supabase) {
      const { error } = await supabase.from("perfiles").select("id").limit(1);
      if (error) return;
    } else if (supabaseConfigured) {
      const response = await fetch(`${supabaseUrl}/rest/v1/perfiles?select=id&limit=1`, {
        headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
      });
      if (!response.ok) return;
    } else {
      return;
    }
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Si no hay red, el próximo arranque lo intenta de nuevo.
  }
}

export function startSupabaseKeepAlive() {
  void ping(true);
  const timer = window.setInterval(() => { void ping(); }, 60 * 60 * 1000);
  const onOnline = () => { void ping(); };
  window.addEventListener("online", onOnline);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("online", onOnline);
  };
}
