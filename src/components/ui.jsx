import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { isIos, isStandalone, onInstallable, promptInstall } from "../lib/install";

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
      <div className="safe-modal relative z-10 flex min-h-full items-center justify-center px-4 sm:px-6 pointer-events-none">
        <div className={`pointer-events-auto w-full ${wide ? "max-w-5xl" : "max-w-2xl"} max-h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem)] overflow-hidden flex flex-col bg-[#141414] border border-white/10 rounded-2xl shadow-2xl shadow-black`}>
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

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path d="M12 3.5v9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.2 7.2 12 3.4l3.8 3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10.5H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AddHomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8.2v7.6M8.2 12h7.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IosInstallGuide({ onClose }) {
  const steps = [
    {
      title: "Tocá Compartir",
      text: "En la barra inferior de Safari, el cuadrado con la flecha hacia arriba.",
      icon: <ShareIcon />,
    },
    {
      title: "Elegí Agregar a inicio",
      text: "Bajá en el menú hasta el cuadrado con el signo +.",
      icon: <AddHomeIcon />,
    },
  ];

  return (
    <Modal title="Instalar en iPhone" subtitle="Safari no muestra un botón de instalación. Son tres toques." onClose={onClose}>
      <div className="space-y-3 p-5">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#101010] p-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#2c2c2e] text-white">{step.icon}</div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA]">Paso {index + 1}</p>
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm text-[#A1A1AA]">{step.text}</p>
            </div>
          </div>
        ))}
        <div className="rounded-2xl border border-white/10 bg-[#101010] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA]">Paso 3</p>
          <p className="font-semibold">Tocá Agregar</p>
          <p className="mb-3 text-sm text-[#A1A1AA]">Arriba a la derecha. Así queda DG Motors en el inicio del iPhone.</p>
          <div className="flex items-center justify-between rounded-xl bg-[#1c1c1e] px-3 py-2.5 text-sm">
            <span className="text-[#0A84FF]">Cancelar</span>
            <span className="text-xs text-white">Agregar a inicio</span>
            <span className="font-semibold text-[#0A84FF]">Agregar</span>
          </div>
        </div>
        <p className="text-xs text-[#A1A1AA]">Tiene que ser Safari. Si el link se abrió dentro de WhatsApp, primero abrilo en Safari.</p>
      </div>
    </Modal>
  );
}

export function InstallButton({ className = "" }) {
  const [installable, setInstallable] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [guide, setGuide] = useState(false);

  useEffect(() => onInstallable(setInstallable), []);
  useEffect(() => setStandalone(isStandalone()), []);

  if (standalone) return null;

  return (
    <>
      <button
        type="button"
        className={`rounded-full border border-[#DC2626]/60 px-4 py-2.5 text-sm text-white hover:bg-[#DC2626] ${className}`}
        onClick={() => {
          if (isIos()) {
            setGuide(true);
            return;
          }
          if (installable) {
            void promptInstall();
            return;
          }
          window.alert("En Chrome, Edge o Android tocá el menú del navegador y elegí Instalar app.");
        }}
      >
        📲 Instalar App
      </button>
      {guide && <IosInstallGuide onClose={() => setGuide(false)} />}
    </>
  );
}
