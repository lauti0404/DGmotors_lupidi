import { useState } from "react";
import { useAuth } from "../context/Auth";
import { Field, Logo, PrimaryButton, inputClass } from "../components/ui";

export function Login() {
  const { signIn, resetPassword, configured, enterLocal } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgot, setForgot] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (forgot) {
        await resetPassword(email);
        setInfo("Si el email está registrado, te llega el enlace para elegir una clave nueva.");
      } else {
        await signIn(email, password);
      }
    } catch (caught) {
      setError(caught.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="safe-top safe-bottom min-h-dvh bg-[#0A0A0A] text-white grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="h-0.5 bg-[#DC2626] mb-8" />
        <Logo className="h-52 w-52" />
        <p className="mt-4 text-center text-sm text-[#A1A1AA]">Acceso interno de DG Motors. Zona Norte.</p>
        <form onSubmit={submit} className="mt-8 space-y-4 bg-[#141414] border border-white/10 rounded-2xl p-5">
          <Field label="Email">
            <input className={inputClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value.replace(/[\s\r\n]+/g, "").trim())} required />
          </Field>
          {!forgot && (
            <Field label="Contraseña">
              <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value.replace(/[\r\n]/g, "").trim())} required />
            </Field>
          )}
          {error && <p className="text-sm text-red-300">{error}</p>}
          {info && <p className="text-sm text-emerald-300">{info}</p>}
          <PrimaryButton className="w-full" type="submit" disabled={loading}>
            {loading ? "Esperá..." : forgot ? "Enviar enlace" : "Entrar"}
          </PrimaryButton>
          <button type="button" className="w-full text-sm text-[#A1A1AA] hover:text-white" onClick={() => { setForgot((value) => !value); setError(""); setInfo(""); }}>
            {forgot ? "Volver al ingreso" : "¿Olvidaste tu contraseña?"}
          </button>
          {forgot && <p className="text-xs text-[#A1A1AA]">Solo se envía si ese mail ya es una cuenta del equipo. El enlace llega a esa casilla: escribir otro mail no cambia ninguna clave.</p>}
        </form>
        <button type="button" className="mt-4 w-full text-xs text-[#A1A1AA] hover:text-white" onClick={enterLocal}>
          Revisar en este dispositivo
        </button>
        {!configured && (
          <p className="mt-2 text-center text-[11px] text-zinc-600">Sin claves de Supabase, la revisión queda solo en este dispositivo.</p>
        )}
      </div>
    </div>
  );
}

export function NewPassword() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (password.length < 6) {
      setError("La clave necesita al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las claves no coinciden.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await updatePassword(password);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="safe-top safe-bottom min-h-dvh bg-[#0A0A0A] text-white grid place-items-center px-4">
      <div className="w-full max-w-md">
      <Logo className="mb-6 h-52 w-52" />
      <form onSubmit={submit} className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
        <h1 className="font-display text-3xl uppercase tracking-wide">Nueva contraseña</h1>
        <Field label="Nueva contraseña">
          <input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </Field>
        <Field label="Confirmar">
          <input className={inputClass} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
        </Field>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <PrimaryButton className="w-full" type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar clave"}</PrimaryButton>
      </form>
      </div>
    </div>
  );
}
