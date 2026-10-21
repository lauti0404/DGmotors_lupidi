import { useState } from "react";
import { useAuth } from "../context/Auth";
import { useData } from "../context/Data";
import { CatalogoComercial } from "../components/CatalogoComercial";
import { supabase } from "../lib/supabase";
import { InstallButton, Field, PrimaryButton, inputClass } from "../components/ui";

export function Configuracion({ admin = false }) {
  const { updatePassword, user } = useAuth();
  const { perfiles, membresias = [], detailing_packs = [], detailing_pack_items = [], detailing_extras = [], save, remove, syncNow } = useData();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [account, setAccount] = useState({ nombre: "", email: "", password: "", rol: "operador" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canCreate = admin;

  async function changePassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 6) {
      setError("La clave necesita al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las claves no coinciden.");
      return;
    }
    try {
      await updatePassword(password);
      setPassword("");
      setConfirm("");
      setMessage("Contraseña actualizada.");
    } catch (caught) {
      setError(caught.message);
    }
  }

  async function createAccount(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!supabase) {
      setError("Primero hay que cargar las claves de Supabase.");
      return;
    }
    if (!navigator.onLine) {
      setError("Crear una cuenta necesita internet.");
      return;
    }
    const { error: rpcError } = await supabase.rpc("crear_usuario_interno", {
      nuevo_email: account.email.trim(),
      nueva_password: account.password,
      nuevo_nombre: account.nombre.trim(),
      nuevo_rol: account.rol,
    });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setAccount({ nombre: "", email: "", password: "", rol: "operador" });
    setMessage("Cuenta creada. La sesión actual sigue abierta.");
    await syncNow();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <form onSubmit={changePassword} className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-2xl uppercase">Mi contraseña</h2>
        <p className="text-sm text-[#A1A1AA]">{user?.email}</p>
        <Field label="Nueva contraseña"><input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></Field>
        <Field label="Confirmar"><input className={inputClass} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></Field>
        <PrimaryButton type="submit">Guardar clave</PrimaryButton>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {message && <p className="text-sm text-emerald-300">{message}</p>}
      </form>

      <section className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-2xl uppercase">Instalar en este dispositivo</h2>
        <p className="text-sm text-[#A1A1AA]">El navegador no deja instalar la app solo: tiene que haber un toque de la persona. En Chrome o Edge, este botón abre la instalación cuando el equipo lo permite. En el teléfono, también se puede usar “Agregar a inicio” desde el menú del navegador.</p>
        <InstallButton />
      </section>

      {canCreate && (
        <CatalogoComercial
          membresias={membresias}
          detailing_packs={detailing_packs}
          detailing_pack_items={detailing_pack_items}
          detailing_extras={detailing_extras}
          save={save}
          remove={remove}
        />
      )}

      {canCreate && <section className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4 lg:col-span-2">
        <h2 className="font-display text-2xl uppercase">Cuentas internas</h2>
        <p className="text-sm text-[#A1A1AA]">Solo las ve un admin.</p>
          <form onSubmit={createAccount} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Nombre"><input className={inputClass} value={account.nombre} onChange={(event) => setAccount({ ...account, nombre: event.target.value })} required /></Field>
            <Field label="Email"><input className={inputClass} type="email" value={account.email} onChange={(event) => setAccount({ ...account, email: event.target.value })} required /></Field>
            <Field label="Clave inicial"><input className={inputClass} type="text" value={account.password} onChange={(event) => setAccount({ ...account, password: event.target.value })} required /></Field>
            <Field label="Rol">
              <select className={inputClass} value={account.rol} onChange={(event) => setAccount({ ...account, rol: event.target.value })}>
                <option value="operador">operador</option>
                <option value="admin">admin</option>
              </select>
            </Field>
            <PrimaryButton type="submit" className="sm:col-span-2 lg:col-span-4 w-fit">Crear cuenta</PrimaryButton>
          </form>
        <div className="divide-y divide-white/5 border border-white/10 rounded-xl">
          {perfiles.length === 0 ? <p className="p-4 text-sm text-[#A1A1AA]">Todavía no hay perfiles descargados.</p> : perfiles.map((item) => (
            <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <span>{item.nombre || item.email}<span className="block text-xs text-[#A1A1AA]">{item.email}</span></span>
              <span className="uppercase text-[11px] tracking-[0.14em] text-[#DC2626]">{item.rol}</span>
            </div>
          ))}
        </div>
      </section>}
    </div>
  );
}
