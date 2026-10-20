import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { RUBROS } from "../lib/constants";
import { dismissAlert, syncAlerts } from "../lib/alerts";
import { balanceOf, formatDateTime, formatWhen, money } from "../lib/format";
import { useData } from "../context/Data";
import { CutLabel, Field, PrimaryButton, inputClass } from "../components/ui";

function openCreate(kind) {
  sessionStorage.setItem("dg_quick_create", kind);
}

export function Dashboard({ onNavigate }) {
  const { vehiculos, gestiones, movimientos_caja, clientes, pending } = useData();
  const [moneda, setMoneda] = useState("ARS");
  const [alerts, setAlerts] = useState([]);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  useEffect(() => {
    setAlerts(syncAlerts({ vehiculos, gestiones, clientes }));
  }, [vehiculos, gestiones, clientes]);

  const stock = vehiculos.filter((vehicle) => vehicle.estado !== "Vendido");
  const consigna = stock.filter((vehicle) => vehicle.modalidad === "Consigna Digital").length;
  const wash = stock.filter((vehicle) => vehicle.modalidad === "Wash & Sell").length;
  const activas = gestiones.filter((gestion) => !["Finalizado", "Listo"].includes(gestion.etapa));
  const detailing = activas.filter((gestion) => gestion.sector === "Detailing").length;
  const gestoria = activas.filter((gestion) => gestion.sector === "Gestoria").length;

  const chart = useMemo(() => RUBROS.map((rubro) => {
    const rows = movimientos_caja.filter((row) => row.moneda === moneda && rubro.categories.includes(row.categoria));
    const sum = (tipo) => rows.filter((row) => row.tipo === tipo).reduce((total, row) => total + (Number(row.monto) || 0), 0);
    return { name: rubro.label, ingresos: sum("Ingreso"), egresos: sum("Egreso") };
  }), [movimientos_caja, moneda]);

  const visible = alerts.filter((alert) => {
    const day = String(alert.cuando || "").slice(0, 10);
    if (desde && day < desde) return false;
    if (hasta && day > hasta) return false;
    return true;
  });
  const live = pending ? [{ id: "sync", tone: "info", kicker: "Sync", text: `${pending} cambios esperan sincronizarse con Supabase.`, detalle: "Está pasando ahora.", cuando: new Date().toISOString(), resuelto_en: null }] : [];

  const alertTone = {
    danger: "border-red-500/50 bg-red-500/10 text-red-50",
    warn: "border-amber-400/50 bg-amber-400/10 text-amber-50",
    info: "border-sky-400/50 bg-sky-400/10 text-sky-50",
  };
  const alertMark = { danger: "bg-[#DC2626]", warn: "bg-amber-300", info: "bg-sky-300" };

  function go(section, kind) {
    openCreate(kind);
    onNavigate(section);
  }

  const cards = [
    ["Caja ARS", money(balanceOf(movimientos_caja, "ARS"), "ARS")],
    ["Caja USD", money(balanceOf(movimientos_caja, "USD"), "USD")],
    ["Vehículos en stock", `${stock.length}`, `${consigna} consigna · ${wash} wash & sell`],
    ["Gestiones activas", `${activas.length}`, `${detailing} detailing · ${gestoria} gestoría`],
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map(([label, value, hint]) => (
          <article key={label} className="bg-[#141414] border border-white/10 rounded-2xl p-4">
            <CutLabel>{label}</CutLabel>
            <div className="mt-4 font-display text-3xl tracking-wide">{value}</div>
            {hint && <p className="text-xs text-[#A1A1AA] mt-2">{hint}</p>}
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <PrimaryButton onClick={() => go("stock", "vehiculo")}>Cargar auto</PrimaryButton>
        <PrimaryButton onClick={() => go("clientes", "cliente")}>Cargar cliente</PrimaryButton>
        <PrimaryButton onClick={() => go("gestoria", "gestion")}>Cargar gestoría</PrimaryButton>
        <PrimaryButton onClick={() => go("detailing", "detailing")}>Cargar detailing</PrimaryButton>
        <PrimaryButton onClick={() => go("caja", "caja")}>Cargar movimiento</PrimaryButton>
      </div>

      <section className="bg-[#141414] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-xl uppercase tracking-wide">Ingresos y egresos por rubro</h2>
          <div className="flex gap-2">
            {["ARS", "USD"].map((item) => (
              <button key={item} type="button" onClick={() => setMoneda(item)} className={`rounded-full px-3 py-1 text-xs border ${moneda === item ? "bg-[#DC2626] border-[#DC2626]" : "border-white/10 text-[#A1A1AA]"}`}>{item}</button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid stroke="#1F1F1F" vertical={false} />
              <XAxis dataKey="name" stroke="#A1A1AA" fontSize={11} tickLine={false} />
              <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: "#141414", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12 }} />
              <Bar dataKey="ingresos" fill="#DC2626" radius={[6, 6, 0, 0]} />
              <Bar dataKey="egresos" fill="#A1A1AA" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-[#141414] border border-white/10 rounded-2xl p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl uppercase tracking-wide">Alertas</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                En vivo
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-[#A1A1AA]">Se anotan cuando pasa una reserva, un impago o una membresía agotada. Las urgentes se borran solas a los 6 meses y el resto al año. También se pueden quitar a mano.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Desde"><input className={inputClass} type="date" value={desde} onChange={(event) => setDesde(event.target.value)} /></Field>
            <Field label="Hasta"><input className={inputClass} type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} /></Field>
          </div>
        </div>
        {live.length + visible.length === 0 ? <p className="text-sm text-[#A1A1AA]">No hay alertas en esas fechas.</p> : (
          <ul className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
            {[...live, ...visible].map((alert) => (
              <li key={alert.id} className={`flex overflow-hidden rounded-xl border text-sm ${alert.resuelto_en ? "border-white/10 bg-white/[0.03] text-[#A1A1AA]" : alertTone[alert.tone]}`}>
                <span className={`w-1.5 shrink-0 ${alert.resuelto_en ? "bg-white/20" : alertMark[alert.tone]}`} />
                <span className="min-w-0 px-3 py-2.5">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-[11px] uppercase tracking-[0.18em] opacity-80">{alert.resuelto_en ? "Resuelta" : alert.kicker}</span>
                    <span className="text-[11px] opacity-70">{formatWhen(alert.cuando)}</span>
                  </span>
                  <span className="mt-1 block">{alert.text}</span>
                  {alert.detalle && <span className="mt-1 block text-xs opacity-75">{alert.detalle}</span>}
                  {alert.resuelto_en && <span className="mt-1 block text-[11px] uppercase tracking-[0.12em]">Cerrada el {formatDateTime(alert.resuelto_en)}</span>}
                  {alert.id !== "sync" && (
                    <button type="button" className="mt-2 text-[11px] uppercase tracking-[0.12em] opacity-70 hover:opacity-100" onClick={() => setAlerts(dismissAlert(alert.id))}>Quitar</button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
