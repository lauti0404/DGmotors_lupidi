import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadProfile, saveProfile } from "../lib/offline";
import { loadStoredAuthUser, supabase, supabaseConfigured } from "../lib/supabase";

const AuthContext = createContext(null);

function sessionRejected(error) {
  const text = `${error?.code || ""} ${error?.message || ""}`;
  return /invalid_grant|refresh_token_not_found|session_not_found|user_not_found|user_banned|bad_jwt/i.test(text);
}

function authError(error) {
  const message = String(error?.message || "");
  if (/invalid login|invalid_credentials/i.test(message) || error?.code === "invalid_credentials") {
    return "Supabase rechazó el ingreso. El usuario existe, pero la contraseña no coincide o el mail no está confirmado. Abrí ese usuario y revisá Confirmed at.";
  }
  if (/email not confirmed/i.test(message) || error?.code === "email_not_confirmed") {
    return "El usuario existe, pero el mail no está confirmado. Entrá a Authentication → Users y marcalo como confirmado.";
  }
  if (/rate limit/i.test(message)) return "Esperá un momento y volvé a intentar.";
  if (/failed to fetch|network/i.test(message)) return "Sin conexión. La recuperación de clave necesita internet.";
  return message || "No se pudo completar el acceso.";
}

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recovery, setRecovery] = useState(() => window.location.hash.includes("type=recovery"));

  useEffect(() => {
    let active = true;

    async function hydrate(sessionUser) {
      if (!sessionUser) return;
      const cached = loadProfile();
      if (cached?.id === sessionUser.id) setProfile(cached);
      if (!supabase || !navigator.onLine) return;
      const { data } = await supabase.from("perfiles").select("*").eq("id", sessionUser.id).maybeSingle();
      if (!active || !data) return;
      setProfile(data);
      saveProfile(data);
    }

    function applyStored(stored) {
      const cached = loadProfile();
      setUser(stored.user);
      if (cached?.id === stored.user.id) setProfile(cached);
    }

    async function boot() {
      if (!supabase) {
        const cached = loadProfile();
        if (cached?.local) {
          setUser({ id: cached.id, email: cached.email, local: true });
          setProfile(cached);
        }
        if (active) setReady(true);
        return;
      }

      const stored = loadStoredAuthUser();
      const tokenReady = stored && stored.expiresAt * 1000 - Date.now() > 90 * 1000;
      const openedFromMemory = Boolean(stored && (!navigator.onLine || !tokenReady));
      if (openedFromMemory) {
        applyStored(stored);
        if (active) setReady(true);
      }

      const { data, error } = await supabase.auth.getSession();
      const sessionUser = data.session?.user || null;
      if (!active) return;
      if (sessionUser) {
        setUser(sessionUser);
        await hydrate(sessionUser);
        if (openedFromMemory) {
          window.dispatchEvent(new Event("dg-session-ready"));
          window.setTimeout(() => window.dispatchEvent(new Event("dg-session-ready")), 400);
        }
      } else if (!sessionRejected(error) && stored) {
        applyStored(stored);
      } else if (!navigator.onLine) {
        const cached = loadProfile();
        if (cached && !cached.local) {
          setUser({ id: cached.id, email: cached.email, offline: true });
          setProfile(cached);
        }
      } else if (sessionRejected(error)) {
        saveProfile(null);
        setUser(null);
        setProfile(null);
      }
      if (active) setReady(true);
    }

    const onOnline = () => {
      if (!supabase) return;
      void supabase.auth.getSession().then(({ data }) => {
        if (!active || !data.session?.user) return;
        setUser(data.session.user);
        void hydrate(data.session.user);
        window.dispatchEvent(new Event("dg-session-ready"));
      });
    };

    const subscription = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        return;
      }
      if (session?.user) {
        setUser(session.user);
        void hydrate(session.user);
      }
    });

    window.addEventListener("online", onOnline);
    void boot();
    return () => {
      active = false;
      window.removeEventListener("online", onOnline);
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    if (!supabase) throw new Error("Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.replace(/[\s\r\n]+/g, "").trim().toLowerCase(),
      password: password.replace(/[\r\n]/g, "").trim(),
    });
    if (error) throw new Error(authError(error));
    setUser(data.user);
    const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", data.user.id).maybeSingle();
    if (perfil) {
      setProfile(perfil);
      saveProfile(perfil);
    }
  }

  async function signOut() {
    saveProfile(null);
    setUser(null);
    setProfile(null);
    if (supabase) await supabase.auth.signOut();
  }

  async function resetPassword(email) {
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@")) throw new Error("Escribí el mail de la cuenta.");
    if (!supabase) throw new Error("Supabase no está configurado.");
    if (!navigator.onLine) throw new Error("Necesitás internet para enviar el correo.");
    const { data: allowed, error: rpcError } = await supabase.rpc("correo_interno_existe", { correo: clean });
    let known = allowed === true;
    if (rpcError) {
      const { data, error } = await supabase.from("perfiles").select("email").ilike("email", clean);
      known = !error && (data || []).some((row) => String(row.email || "").toLowerCase() === clean);
    }
    if (!known) throw new Error("Ese mail no es una cuenta interna. No se envió ningún correo.");
    const { error } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo: window.location.origin });
    if (error) throw new Error(authError(error));
  }

  async function updatePassword(password) {
    if (!supabase) throw new Error("Supabase no está configurado.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(authError(error));
    window.history.replaceState(null, "", window.location.pathname);
    setRecovery(false);
  }

  function enterLocal() {
    const local = {
      id: crypto.randomUUID(),
      email: "revision@dgmotors.app",
      nombre: "Revisión local",
      rol: "admin",
      local: true,
    };
    saveProfile(local);
    setProfile(local);
    setUser({ id: local.id, email: local.email, local: true });
  }

  const value = useMemo(
    () => ({
      ready,
      user,
      profile,
      recovery,
      configured: supabaseConfigured,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      enterLocal,
      clearRecovery: () => setRecovery(false),
    }),
    [ready, user, profile, recovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth fuera de AuthProvider");
  return context;
}
