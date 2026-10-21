import { useState } from "react";
import { DURACIONES_MEMBRESIA, EXTRAS_INICIAL, ITEMS_INICIAL, MEMBRESIAS_INICIAL, PACKS_INICIAL, filasVisibles, itemsDelPack } from "../lib/catalogo";
import { money } from "../lib/format";
import { Field, GhostButton, Modal, PrimaryButton, inputClass } from "./ui";

function nuevoId() {
  return crypto.randomUUID();
}

export function CatalogoComercial({ membresias = [], detailing_packs = [], detailing_pack_items = [], detailing_extras = [], save, remove }) {
  const [plan, setPlan] = useState(null);
  const [pack, setPack] = useState(null);
  const [extra, setExtra] = useState(null);
  const planes = filasVisibles(membresias, MEMBRESIAS_INICIAL);
  const packs = filasVisibles(detailing_packs, PACKS_INICIAL);
  const extras = filasVisibles(detailing_extras, EXTRAS_INICIAL);
  const packsSemilla = !detailing_packs.length;

  function materializar(table, rows, seeds) {
    if (rows.length) return;
    for (const seed of seeds) save(table, seed);
  }

  function guardarPlan(event) {
    event.preventDefault();
    if (!plan.nombre.trim()) return;
    materializar("membresias", membresias, MEMBRESIAS_INICIAL);
    save("membresias", plan);
    setPlan(null);
  }

  function borrarPlan(item) {
    if (!window.confirm(`¿Eliminar la membresía ${item.nombre}?`)) return;
    materializar("membresias", membresias, MEMBRESIAS_INICIAL);
    remove("membresias", item.id);
  }

  function guardarPack(event) {
    event.preventDefault();
    if (!pack.nombre.trim()) return;
    if (!detailing_packs.length) {
      for (const seed of PACKS_INICIAL) save("detailing_packs", seed);
      for (const seed of ITEMS_INICIAL) save("detailing_pack_items", seed);
    }
    save("detailing_packs", {
      id: pack.id,
      nombre: pack.nombre,
      subtitulo: pack.subtitulo || "",
      moneda: pack.moneda || "ARS",
      precio: pack.precio ?? 0,
      orden: pack.orden || packs.length + 1,
      creado_en: pack.creado_en,
    });
    const previous = itemsDelPack(pack.id, detailing_pack_items, packsSemilla);
    const kept = new Set(pack.items.map((item) => item.id));
    for (const item of previous) {
      if (!kept.has(item.id)) remove("detailing_pack_items", item.id);
    }
    pack.items.forEach((item, index) => {
      if (!item.descripcion_item.trim()) return;
      save("detailing_pack_items", { id: item.id, pack_id: pack.id, descripcion_item: item.descripcion_item.trim(), orden: index + 1 });
    });
    setPack(null);
  }

  function borrarPack(item) {
    if (!window.confirm(`¿Eliminar el pack ${item.nombre}?`)) return;
    const children = itemsDelPack(item.id, detailing_pack_items, packsSemilla);
    if (!detailing_packs.length) {
      for (const seed of PACKS_INICIAL) save("detailing_packs", seed);
      for (const seed of ITEMS_INICIAL) save("detailing_pack_items", seed);
    }
    for (const child of children) remove("detailing_pack_items", child.id);
    remove("detailing_packs", item.id);
  }

  function guardarExtra(event) {
    event.preventDefault();
    if (!extra.nombre.trim()) return;
    materializar("detailing_extras", detailing_extras, EXTRAS_INICIAL);
    save("detailing_extras", extra);
    setExtra(null);
  }

  function borrarExtra(item) {
    if (!window.confirm(`¿Eliminar el extra ${item.nombre}?`)) return;
    materializar("detailing_extras", detailing_extras, EXTRAS_INICIAL);
    remove("detailing_extras", item.id);
  }

  function abrirPack(item) {
    setPack({
      ...item,
      items: itemsDelPack(item.id, detailing_pack_items, packsSemilla).map((row) => ({ ...row })),
    });
  }

  return (
    <section className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-6 lg:col-span-2">
      <div>
        <h2 className="font-display text-2xl uppercase">Membresías, packs y extras</h2>
        <p className="mt-1 text-sm text-[#A1A1AA]">Solo el admin los cambia. Al sincronizar, el resto del equipo los usa para las fichas y los trabajos.</p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg uppercase tracking-wide text-[#DC2626]">Membresías</h3>
          <PrimaryButton className="px-3 py-1.5 text-xs" onClick={() => setPlan({ id: nuevoId(), nombre: "", duracion: "Mensual", lavados_totales: 1, detalle_packs: "", moneda: "ARS", precio: 0 })}>+ Nueva Membresía</PrimaryButton>
        </div>
        {planes.map((item) => (
          <article key={item.id} className="rounded-xl border border-white/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-display text-xl uppercase">{item.nombre}</div>
                <p className="mt-1 text-xs text-[#A1A1AA]">{item.duracion} · {item.lavados_totales} lavados · {money(item.precio, item.moneda)}</p>
                {item.detalle_packs && <p className="mt-2 whitespace-pre-line text-sm text-[#A1A1AA]">{item.detalle_packs}</p>}
              </div>
              <div className="flex gap-2">
                <GhostButton className="px-3 py-1.5 text-xs" onClick={() => setPlan({ ...item })}>Editar</GhostButton>
                <GhostButton className="px-3 py-1.5 text-xs" onClick={() => borrarPlan(item)}>Eliminar</GhostButton>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg uppercase tracking-wide text-[#DC2626]">Detailing packs</h3>
          <PrimaryButton className="px-3 py-1.5 text-xs" onClick={() => setPack({ id: nuevoId(), nombre: "", subtitulo: "", moneda: "ARS", precio: 0, orden: packs.length + 1, items: [] })}>+ Nuevo Pack de Detailing</PrimaryButton>
        </div>
        {packs.map((item) => (
          <article key={item.id} className="rounded-xl border border-white/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-display text-xl uppercase">{item.nombre}</div>
                <p className="mt-1 text-xs text-[#A1A1AA]">{item.subtitulo || "Sin subtítulo"} · {money(item.precio, item.moneda)}</p>
                <ul className="mt-2 space-y-1 text-sm text-[#A1A1AA]">
                  {itemsDelPack(item.id, detailing_pack_items, packsSemilla).map((row) => <li key={row.id}>• {row.descripcion_item}</li>)}
                </ul>
              </div>
              <div className="flex gap-2">
                <GhostButton className="px-3 py-1.5 text-xs" onClick={() => abrirPack(item)}>Editar</GhostButton>
                <GhostButton className="px-3 py-1.5 text-xs" onClick={() => borrarPack(item)}>Eliminar</GhostButton>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg uppercase tracking-wide text-[#DC2626]">Extras</h3>
          <PrimaryButton className="px-3 py-1.5 text-xs" onClick={() => setExtra({ id: nuevoId(), nombre: "", descripcion: "", moneda: "ARS", precio: 0 })}>+ Nuevo Extra</PrimaryButton>
        </div>
        {extras.map((item) => (
          <article key={item.id} className="rounded-xl border border-white/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-display text-xl uppercase">{item.nombre}</div>
                <p className="mt-1 text-sm text-[#A1A1AA]">{item.descripcion}</p>
                <p className="mt-1 text-xs text-[#A1A1AA]">{money(item.precio, item.moneda)}</p>
              </div>
              <div className="flex gap-2">
                <GhostButton className="px-3 py-1.5 text-xs" onClick={() => setExtra({ ...item })}>Editar</GhostButton>
                <GhostButton className="px-3 py-1.5 text-xs" onClick={() => borrarExtra(item)}>Eliminar</GhostButton>
              </div>
            </div>
          </article>
        ))}
      </div>

      {plan && (
        <Modal title={membresias.some((item) => item.id === plan.id) || MEMBRESIAS_INICIAL.some((item) => item.id === plan.id) ? "Editar membresía" : "Nueva membresía"} onClose={() => setPlan(null)}>
          <form onSubmit={guardarPlan} className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Nombre"><input className={inputClass} value={plan.nombre} onChange={(event) => setPlan({ ...plan, nombre: event.target.value })} required /></Field>
            <Field label="Duración">
              <select className={inputClass} value={plan.duracion} onChange={(event) => setPlan({ ...plan, duracion: event.target.value })}>
                {DURACIONES_MEMBRESIA.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Lavados del plan"><input className={inputClass} type="number" min="0" value={plan.lavados_totales ?? 0} onChange={(event) => setPlan({ ...plan, lavados_totales: event.target.value })} /></Field>
            <Field label="Precio"><input className={inputClass} type="number" value={plan.precio ?? 0} onChange={(event) => setPlan({ ...plan, precio: event.target.value })} /></Field>
            <Field label="Moneda">
              <select className={inputClass} value={plan.moneda || "ARS"} onChange={(event) => setPlan({ ...plan, moneda: event.target.value })}>
                <option>ARS</option><option>USD</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Detalle de packs" hint="Qué incluye el plan. Un renglón por pack.">
                <textarea className={`${inputClass} min-h-28`} value={plan.detalle_packs || ""} onChange={(event) => setPlan({ ...plan, detalle_packs: event.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <PrimaryButton type="submit">Guardar</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {pack && (
        <Modal title="Pack de detailing" onClose={() => setPack(null)}>
          <form onSubmit={guardarPack} className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Nombre"><input className={inputClass} value={pack.nombre} onChange={(event) => setPack({ ...pack, nombre: event.target.value })} required /></Field>
            <Field label="Subtítulo"><input className={inputClass} value={pack.subtitulo || ""} onChange={(event) => setPack({ ...pack, subtitulo: event.target.value })} /></Field>
            <Field label="Precio"><input className={inputClass} type="number" value={pack.precio ?? 0} onChange={(event) => setPack({ ...pack, precio: event.target.value })} /></Field>
            <Field label="Moneda">
              <select className={inputClass} value={pack.moneda || "ARS"} onChange={(event) => setPack({ ...pack, moneda: event.target.value })}>
                <option>ARS</option><option>USD</option>
              </select>
            </Field>
            <div className="sm:col-span-2 space-y-2">
              <span className="block text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA] underline decoration-white/30 underline-offset-4">Ítems del pack:</span>
              {pack.items.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <input className={inputClass} value={item.descripcion_item} onChange={(event) => setPack({ ...pack, items: pack.items.map((row) => row.id === item.id ? { ...row, descripcion_item: event.target.value } : row) })} />
                  <GhostButton className="shrink-0 px-3 py-1.5 text-xs" onClick={() => setPack({ ...pack, items: pack.items.filter((row) => row.id !== item.id) })}>Quitar</GhostButton>
                </div>
              ))}
              <GhostButton className="px-3 py-1.5 text-xs" onClick={() => setPack({ ...pack, items: [...pack.items, { id: nuevoId(), descripcion_item: "" }] })}>Agregar ítem</GhostButton>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <PrimaryButton type="submit">Guardar</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {extra && (
        <Modal title="Extra de detailing" onClose={() => setExtra(null)}>
          <form onSubmit={guardarExtra} className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Nombre"><input className={inputClass} value={extra.nombre} onChange={(event) => setExtra({ ...extra, nombre: event.target.value })} required /></Field>
            <Field label="Precio"><input className={inputClass} type="number" value={extra.precio ?? 0} onChange={(event) => setExtra({ ...extra, precio: event.target.value })} /></Field>
            <Field label="Moneda">
              <select className={inputClass} value={extra.moneda || "ARS"} onChange={(event) => setExtra({ ...extra, moneda: event.target.value })}>
                <option>ARS</option><option>USD</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descripción"><textarea className={`${inputClass} min-h-24`} value={extra.descripcion || ""} onChange={(event) => setExtra({ ...extra, descripcion: event.target.value })} /></Field>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <PrimaryButton type="submit">Guardar</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
