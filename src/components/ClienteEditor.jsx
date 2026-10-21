import { useState } from "react";
import { useAuth } from "../context/Auth";
import { useData } from "../context/Data";
import { CATEGORIAS_CLIENTE } from "../lib/constants";
import { MEMBRESIAS_INICIAL, filasVisibles } from "../lib/catalogo";
import { comprimirImagenDataUrl } from "../lib/comprimirImagen";
import { categoryList, digitsOnly, money, phoneLocal, plateOnly } from "../lib/format";
import { ArchivoViewer } from "./ArchivoViewer";
import { ClienteImagenes } from "./ClienteImagenes";
import { ImageCropper } from "./ImageCropper";
import { SelectorArchivo } from "./SelectorArchivo";
import { Field, GhostButton, Modal, PrimaryButton, inputClass } from "./ui";

export function ClienteEditor({ initial, onClose, onSaved }) {
  const { user } = useAuth();
  const { clientes, membresias = [], cliente_imagenes = [], save, remove } = useData();
  const [editor, setEditor] = useState(initial);
  const [cropSrc, setCropSrc] = useState("");
  const [viewer, setViewer] = useState(false);
  const exists = clientes.some((cliente) => cliente.id === editor.id);
  const planes = filasVisibles(membresias, MEMBRESIAS_INICIAL);
  const plan = planes.find((item) => item.nombre === editor.membresia);
  const withPlan = editor.membresia && editor.membresia !== "Ninguna";
  const selected = categoryList(editor.categoria);

  function toggleCategory(item) {
    const next = selected.includes(item) ? selected.filter((value) => value !== item) : [...selected, item];
    setEditor({ ...editor, categoria: next.join(", ") });
  }

  async function onFile(file) {
    if (!file) return;
    try {
      setCropSrc(await comprimirImagenDataUrl(file));
    } catch (caught) {
      window.alert(caught.message);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (!editor.nombre.trim()) return;
    const saved = save("clientes", { ...editor, creado_por: editor.creado_por || user?.id || null });
    onSaved?.(saved);
    onClose();
  }

  return (
    <Modal title={exists ? "Editar cliente" : "Nueva ficha de cliente"} onClose={onClose}>
      <form onSubmit={submit} className="p-5 grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 flex items-center gap-4">
          <button type="button" className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-black" onClick={() => editor.foto_url && setViewer(true)}>
            {editor.foto_url ? <img src={editor.foto_url} alt="" className="h-full w-full object-cover" /> : <span className="px-2 text-center text-[10px] uppercase tracking-[0.12em] text-[#A1A1AA]">Sin foto</span>}
          </button>
          <Field label="Foto de perfil" hint="Opcional. Desde galería, fotos, cámara o archivos. Se recorta en círculo. Tocá la foto para verla de cerca.">
            <SelectorArchivo onFile={onFile} />
          </Field>
        </div>
        <Field label="Nombre"><input className={inputClass} value={editor.nombre} onChange={(event) => setEditor({ ...editor, nombre: event.target.value })} required /></Field>
        <Field label="Teléfono" hint="Ej: 1150649934. Sin +54, se agrega solo al escribir por WhatsApp.">
          <input className={inputClass} inputMode="numeric" placeholder="1150649934" value={editor.telefono || ""} onChange={(event) => setEditor({ ...editor, telefono: phoneLocal(event.target.value) })} />
        </Field>
        <Field label="Email" hint="Ej: nombre@mail.com">
          <input className={inputClass} type="email" placeholder="nombre@mail.com" value={editor.email || ""} onChange={(event) => setEditor({ ...editor, email: event.target.value.trim() })} />
        </Field>
        <Field label="DNI / CUIT" hint="DNI: hasta 8 números. CUIT: 11 números. Ej: 30123456">
          <input className={inputClass} inputMode="numeric" placeholder="30123456" value={editor.dni_cuit || ""} onChange={(event) => setEditor({ ...editor, dni_cuit: digitsOnly(event.target.value, 11) })} />
        </Field>
        <Field label="Vehículo actual" hint="Opcional. Ej: Gol Trend 2016">
          <input className={inputClass} placeholder="Opcional" value={editor.vehiculo_actual || ""} onChange={(event) => setEditor({ ...editor, vehiculo_actual: event.target.value })} />
        </Field>
        <Field label="Patente" hint="Opcional. Solo letras y números. Ej: AB123CD">
          <input className={inputClass} placeholder="AB123CD" value={editor.patente || ""} onChange={(event) => setEditor({ ...editor, patente: plateOnly(event.target.value) })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Categorías" hint="Se puede marcar más de una.">
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS_CLIENTE.map((item) => (
                <label key={item} className={`rounded-full border px-3 py-1.5 text-xs ${selected.includes(item) ? "bg-[#DC2626] border-[#DC2626]" : "border-white/10 text-[#A1A1AA]"}`}>
                  <input className="sr-only" type="checkbox" checked={selected.includes(item)} onChange={() => toggleCategory(item)} />
                  {item}
                </label>
              ))}
            </div>
          </Field>
        </div>
        <Field label="Membresía">
          <select className={inputClass} value={editor.membresia} onChange={(event) => {
            const next = planes.find((item) => item.nombre === event.target.value);
            setEditor({ ...editor, membresia: event.target.value, lavados_totales: next ? Number(next.lavados_totales) || 0 : 0, lavados_usados: next ? editor.lavados_usados : 0 });
          }}>
            <option>Ninguna</option>
            {planes.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}{Number(item.precio) ? ` · ${money(item.precio, item.moneda)}` : ""}</option>)}
          </select>
          {plan && <p className="mt-2 text-xs text-[#A1A1AA]">{plan.duracion}{plan.detalle_packs ? ` · ${String(plan.detalle_packs).split("\n").filter(Boolean).join(" · ")}` : ""}</p>}
        </Field>
        {withPlan && (
          <>
            <Field label="Lavados usados"><input className={inputClass} type="number" min="0" value={editor.lavados_usados ?? 0} onChange={(event) => setEditor({ ...editor, lavados_usados: event.target.value })} /></Field>
            <Field label="Lavados del plan"><input className={inputClass} type="number" min="0" value={editor.lavados_totales ?? 0} onChange={(event) => setEditor({ ...editor, lavados_totales: event.target.value })} /></Field>
            <Field label="Último servicio"><input className={inputClass} type="date" value={String(editor.ultimo_servicio || "").slice(0, 10)} onChange={(event) => setEditor({ ...editor, ultimo_servicio: event.target.value || null })} /></Field>
          </>
        )}
        <Field label="Notas"><textarea className={`${inputClass} min-h-24`} value={editor.notas || ""} onChange={(event) => setEditor({ ...editor, notas: event.target.value })} /></Field>
        <div className="sm:col-span-2">
          {exists ? <ClienteImagenes clienteId={editor.id} /> : <p className="text-xs text-[#A1A1AA]">Guardá la ficha para poder sumar el DNI, la licencia u otros documentos.</p>}
        </div>
        <div className="sm:col-span-2 flex justify-between gap-2">
          {exists && (
            <GhostButton onClick={() => { if (window.confirm("¿Eliminar este cliente?")) { cliente_imagenes.filter((item) => item.cliente_id === editor.id).forEach((item) => remove("cliente_imagenes", item.id)); remove("clientes", editor.id); onClose(); } }}>Eliminar</GhostButton>
          )}
          <PrimaryButton type="submit" className="ml-auto">Guardar ficha</PrimaryButton>
        </div>
      </form>
      {cropSrc && (
        <ImageCropper
          shape="circle"
          src={cropSrc}
          onClose={() => setCropSrc("")}
          onConfirm={(dataUrl) => {
            setEditor((current) => ({ ...current, foto_url: dataUrl }));
            setCropSrc("");
          }}
        />
      )}
      {viewer && editor.foto_url && <ArchivoViewer src={editor.foto_url} name={editor.nombre || "Foto de perfil"} onClose={() => setViewer(false)} />}
    </Modal>
  );
}
