import { useState } from "react";
import { METODOS_PAGO, categoriasElegibles } from "../lib/constants";
import { amountOnly, money } from "../lib/format";
import { Field, GhostButton, Modal, PrimaryButton, inputClass } from "./ui";

function bloqueInicial(source) {
  return {
    monto: source?.monto ?? 0,
    concepto: source?.concepto || "",
    categoria: source?.categoria || "",
    moneda: source?.moneda || "ARS",
    metodo: source?.metodo || "Efectivo",
  };
}

export function ConfirmacionCaja({ titulo = "Impactar en caja", subtitulo, ingreso, egreso, aviso, textoOmitir, onOmitir, onClose, onConfirm }) {
  const [inOn, setInOn] = useState(Boolean(ingreso?.activo));
  const [egOn, setEgOn] = useState(Boolean(egreso?.activo));
  const [inFields, setInFields] = useState(() => bloqueInicial(ingreso));
  const [egFields, setEgFields] = useState(() => bloqueInicial(egreso));
  const grupos = categoriasElegibles();
  const mismaMoneda = inFields.moneda === egFields.moneda;
  const precio = Number(amountOnly(inFields.monto)) || 0;
  const costo = Number(amountOnly(egFields.monto)) || 0;
  const neta = precio - costo;

  function confirm(event) {
    event.preventDefault();
    onConfirm({
      ingreso: inOn ? { ...inFields, monto: precio } : null,
      egreso: egOn ? { ...egFields, monto: costo } : null,
    });
  }

  return (
    <Modal title={titulo} subtitle={subtitulo} onClose={onClose}>
      <form onSubmit={confirm} className="space-y-4 p-5">
        <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-4 text-sm">
          <p>Precio cobrado: {money(precio, inFields.moneda)}</p>
          <p className="mt-1">Costo interno / gastos: {money(costo, egFields.moneda)}</p>
          <p className={`mt-2 font-display text-lg uppercase ${mismaMoneda && neta >= 0 ? "text-emerald-300" : mismaMoneda ? "text-red-300" : "text-[#A1A1AA]"}`}>
            {mismaMoneda ? `Ganancia neta: ${money(neta, inFields.moneda)}` : "Ganancia neta: las monedas son distintas, no se restan."}
          </p>
        </div>
        {aviso && <p className="text-xs text-amber-200">{aviso}</p>}
        <MovimientoFields title="Ingreso por el precio cobrado" checked={inOn} onToggle={setInOn} fields={inFields} onChange={setInFields} grupos={grupos} />
        <MovimientoFields title="Egreso por el costo interno / gastos" checked={egOn} onToggle={setEgOn} fields={egFields} onChange={setEgFields} grupos={grupos} />
        <div className="flex flex-wrap justify-end gap-2">
          {textoOmitir && <GhostButton onClick={onOmitir}>{textoOmitir}</GhostButton>}
          <PrimaryButton type="submit">{inOn || egOn ? "Confirmar en caja" : "Continuar sin caja"}</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function MovimientoFields({ title, checked, onToggle, fields, onChange, grupos }) {
  function set(patch) {
    onChange({ ...fields, ...patch });
  }

  return (
    <section className="rounded-xl border border-white/10 p-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={checked} onChange={(event) => onToggle(event.target.checked)} />
        {title}
      </label>
      {checked && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Monto">
            <input className={inputClass} inputMode="numeric" maxLength={10} value={amountOnly(fields.monto) || 0} onChange={(event) => set({ monto: amountOnly(event.target.value) || 0 })} />
          </Field>
          <Field label="Moneda">
            <select className={inputClass} value={fields.moneda} onChange={(event) => set({ moneda: event.target.value })}>
              <option>ARS</option>
              <option>USD</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Concepto">
              <input className={inputClass} value={fields.concepto} onChange={(event) => set({ concepto: event.target.value })} required />
            </Field>
          </div>
          <Field label="Categoría">
            <select className={inputClass} value={fields.categoria} onChange={(event) => set({ categoria: event.target.value })}>
              {grupos.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.categories.map((item) => <option key={item}>{item}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Método de pago">
            <select className={inputClass} value={fields.metodo} onChange={(event) => set({ metodo: event.target.value })}>
              {METODOS_PAGO.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
        </div>
      )}
    </section>
  );
}
