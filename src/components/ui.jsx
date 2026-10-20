import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { isStandalone, onInstallable, promptInstall } from "../lib/install";

export const inputClass =
  "w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#DC2626] placeholder:text-zinc-600";

export function CutLabel({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center bg-[#DC2626] text-white font-display tracking-[0.18em] uppercase text-[11px] leading-none pl-3 pr-5 py-1.5 ${className}`}
      style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)" }}
    >
      {children}
    </span>
  );
}

export function Logo({ className = "h-44 w-44" }) {
  return <img src="/logo.png" alt="DG Motors" className={`mx-auto block select-none object-contain ${className}`} />;
}

const modalStack = [];

export function Modal({ title, subtitle, onClose, children, wide = false }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const token = {};
    modalStack.push(token);
    const onKey = (event) => {
      if (event.key === "Escape" && modalStack.at(-1) === token) closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      const index = modalStack.indexOf(token);
      if (index >= 0) modalStack.splice(index, 1);
      document.body.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[80] overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className={`pointer-events-auto w-full ${wide ? "max-w-5xl" : "max-w-2xl"} max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col bg-[#141414] border border-white/10 rounded-2xl shadow-2xl shadow-black`}>
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/10">
            <div>
              <h2 className="font-display text-2xl tracking-wide uppercase">{title}</h2>
              {subtitle && <p className="text-sm text-[#A1A1AA] mt-1">{subtitle}</p>}
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-full border border-white/10 text-[#A1A1AA] hover:text-white hover:border-[#DC2626]" aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
          <div className="overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function Field({ label, hint, children }) {
  const text = String(label).trim().endsWith(":") ? label : `${label}:`;
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA] underline decoration-white/30 underline-offset-4">{text}</span>
      {hint && <span className="mt-1 block text-[11px] normal-case tracking-normal text-zinc-500">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function Plate({ children }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-stretch overflow-hidden rounded-[3px] border border-white/20 text-[11px] font-bold tracking-wider text-black bg-white">
      <span className="bg-[#1d4ed8] text-white px-1 flex items-center text-[8px]">AR</span>
      <span className="px-1.5 py-0.5">{children}</span>
    </span>
  );
}

const statusStyle = {
  Disponible: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Reservado: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  Vendido: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle[status] || "border-white/10 text-[#A1A1AA]"}`}>
      {status}
    </span>
  );
}

export function Avatar({ name }) {
  const parts = String(name || "").trim().split(/\s+/);
  const initials = `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase() || "DG";
  return (
    <div className="w-10 h-10 shrink-0 rounded-full bg-[#DC2626]/15 border border-[#DC2626]/40 text-white font-display tracking-wide flex items-center justify-center">
      {initials}
    </div>
  );
}

export function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs whitespace-nowrap ${active ? "bg-[#DC2626] border-[#DC2626] text-white" : "border-white/10 text-[#A1A1AA] hover:text-white"}`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button type="button" className={`rounded-full bg-[#DC2626] hover:bg-[#B91C1C] px-4 py-2.5 text-sm font-semibold ${className}`} {...props}>
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }) {
  return (
    <button type="button" className={`rounded-full border border-white/10 px-4 py-2.5 text-sm text-[#A1A1AA] hover:text-white hover:border-[#DC2626] ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Empty({ children }) {
  return <div className="border border-dashed border-white/10 rounded-2xl px-4 py-10 text-center text-sm text-[#A1A1AA]">{children}</div>;
}

export function InstallButton({ className = "" }) {
  const [installable, setInstallable] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => onInstallable(setInstallable), []);
  useEffect(() => setStandalone(isStandalone()), []);

  if (standalone) return <p className="text-xs text-[#A1A1AA]">App instalada en este dispositivo.</p>;

  return (
    <button
      type="button"
      className={`rounded-full border border-[#DC2626]/60 px-4 py-2.5 text-sm text-white hover:bg-[#DC2626] ${className}`}
      onClick={() => {
        if (installable) {
          void promptInstall();
          return;
        }
        window.alert("En Chrome, Edge o Android tocá el menú del navegador y elegí Instalar app. En iPhone: Compartir → Agregar a inicio.");
      }}
    >
      📲 Instalar app en este dispositivo
    </button>
  );
}
