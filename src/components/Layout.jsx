import { Car, ClipboardList, LayoutDashboard, LogOut, Menu, Settings, Sparkles, Users, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/Auth";
import { useData } from "../context/Data";
import { Caja } from "../views/Caja";
import { Clientes } from "../views/Clientes";
import { Configuracion } from "../views/Configuracion";
import { Dashboard } from "../views/Dashboard";
import { Gestiones } from "../views/Gestiones";
import { Stock } from "../views/Stock";
import { InstallButton, Logo } from "./ui";
import { SyncBadge } from "./SyncBadge";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Datos a la mano" },
  { id: "stock", label: "Stock", icon: Car, hint: "Vehículos" },
  { id: "gestoria", label: "Gestoría", icon: ClipboardList, hint: "Trámites y papeles" },
  { id: "detailing", label: "Detailing", icon: Sparkles, hint: "Trabajos y membresías" },
  { id: "clientes", label: "Clientes", icon: Users, hint: "Historial y membresías" },
  { id: "caja", label: "Caja", icon: Wallet, hint: "Ingresos y egresos" },
  { id: "config", label: "Configuración", icon: Settings, hint: "Precios y cuentas", admin: true },
];

const COPY = {
  dashboard: ["Dashboard", "Caja, stock y gestiones del día."],
  stock: ["Stock de vehículos", "Consigna y Wash & Sell."],
  gestoria: ["Gestoría", "Trámites, aunque el auto no esté en stock."],
  detailing: ["Detailing", "Trabajos, packs y membresías."],
  clientes: ["Clientes", "Fichas, historial y WhatsApp."],
  caja: ["Caja", "Pesos, dólares y resultado por rubro."],
  config: ["Configuración", "Precios y cuentas."],
};

export function Layout() {
  const { profile, user, signOut } = useAuth();
  const data = useData();
  const [section, setSection] = useState("dashboard");
  const [open, setOpen] = useState(false);
  const isAdmin = profile?.rol === "admin" || profile?.local;
  const nav = NAV.map((item) => item.id === "config" && !isAdmin ? { ...item, label: "Mi cuenta", hint: "Tu clave" } : item);
  const [title, subtitle] = section === "config" && !isAdmin ? ["Mi cuenta", "Tu clave."] : (COPY[section] || ["Mi cuenta", "Tu clave."]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [section]);

  function go(id) {
    setSection(id);
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#151515] text-white">
      {open && <div className="fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[270px] bg-[#151515] border-r border-white/5 flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="h-0.5 bg-[#DC2626]" />
        <div className="relative px-5 py-6 flex items-center justify-center">
          <Logo className="h-36 w-36" />
          <button type="button" className="lg:hidden absolute right-4 text-[#A1A1AA]" onClick={() => setOpen(false)} aria-label="Cerrar menú">
            <X size={18} />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left ${active ? "bg-[#DC2626] text-white" : "text-[#A1A1AA] hover:bg-white/5 hover:text-white"}`}
              >
                <Icon size={18} />
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={`block text-[11px] ${active ? "text-white/75" : "text-zinc-500"}`}>{item.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto shrink-0 space-y-3 border-t border-white/5 px-4 py-4">
          <InstallButton className="w-full px-3 text-center text-xs" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm truncate">{profile?.nombre || user?.email}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#A1A1AA]">{profile?.rol || "equipo"}</div>
            </div>
            <button type="button" onClick={() => signOut()} className="p-2 rounded-full border border-white/10 text-[#A1A1AA] hover:text-white" aria-label="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-20 bg-[#151515]/90 backdrop-blur border-b border-white/5">
          <div className="h-0.5 bg-[#DC2626]" />
          <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button type="button" className="lg:hidden p-2 border border-white/10 rounded-full" onClick={() => setOpen(true)} aria-label="Abrir menú">
                <Menu size={18} />
              </button>
              <div>
                <h1 className="font-display text-2xl tracking-wide uppercase leading-none">{title}</h1>
                <p className="text-xs text-[#A1A1AA] mt-1">{subtitle}</p>
              </div>
            </div>
            <SyncBadge online={data.online} syncing={data.syncing} pending={data.pending} />
          </div>
          {data.lastSyncError && (
            <div className="px-4 sm:px-6 pb-3 text-xs text-amber-200">Último envío rechazado: {data.lastSyncError}</div>
          )}
          {!data.configured && (
            <div className="px-4 sm:px-6 pb-3 text-xs text-[#A1A1AA]">Supabase todavía no está configurado. Todo queda guardado en este dispositivo.</div>
          )}
        </header>
        <main className="px-4 sm:px-6 py-6">
          {section === "dashboard" && <Dashboard onNavigate={go} />}
          {section === "stock" && <Stock />}
          {section === "gestoria" && <Gestiones sector="Gestoria" />}
          {section === "detailing" && <Gestiones sector="Detailing" />}
          {section === "clientes" && <Clientes />}
          {section === "caja" && <Caja />}
          {section === "config" && <Configuracion admin={isAdmin} />}
        </main>
      </div>
    </div>
  );
}
