import { useState } from "react";
import { useAuth } from "../context/Auth";
import { useData } from "../context/Data";
import { ESTADOS_VEHICULO, MODALIDADES } from "../lib/constants";
import { phoneLocal, plateOnly } from "../lib/format";
import { blankCliente } from "../lib/records";
import { comprimirImagenDataUrl } from "../lib/comprimirImagen";
import { loadImage, removeImage } from "../lib/images";
import { ClienteEditor } from "./ClienteEditor";
import { ImageCropper } from "./ImageCropper";
import { Field, GhostButton, Modal, PrimaryButton, inputClass } from "./ui";

function optionalNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  return value;
}

export function VehiculoEditor({ initial, onClose, onSaved }) {
  const { user } = useAuth();
  const { vehiculos, clientes, save, remove } = useData();
  const [editor, setEditor] = useState(initial);
  const [image, setImage] = useState(() => initial.imagen_url || loadImage(initial.id) || "");
  const [cropSrc, setCropSrc] = useState("");
  const [newCliente, setNewCliente] = useState(null);
  const exists = vehiculos.some((vehicle) => vehicle.id === editor.id);
  const ownerLocked = Boolean(editor.cliente_duenio_id);
  const modalidades = MODALIDADES.includes(editor.modalidad) ? MODALIDADES : [editor.modalidad, ...MODALIDADES];

  function chooseOwner(id) {
    const cliente = clientes.find((item) => item.id === id);
    setEditor({
      ...editor,
      cliente_duenio_id: id || null,
      duenio_nombre: cliente?.nombre || "",
      duenio_telefono: cliente?.telefono || "",
    });
  }

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setCropSrc(await comprimirImagenDataUrl(file));
    } catch (caught) {
      window.alert(caught.message);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (!editor.marca.trim() || !editor.modelo.trim()) return;
    const saved = save("vehiculos", { ...editor, imagen_url: image || null });
    removeImage(saved.id);
    onSaved?.(saved);
    onClose();
  }

  return (
    <>
      <Modal title={exists ? "Editar vehículo" : "Nuevo vehículo"} onClose={onClose} wide>
        <form onSubmit={submit} className="p-5 grid sm:grid-cols-2 gap-4">
          <Field label="Foto" hint="Opcional. Se guarda en el vehículo y la ve todo el equipo. Si no entra en el recuadro, elegís qué parte se ve.">
            <input className={inputClass} type="file" accept="image/*" onChange={onFile} />
            {image && <img src={image} alt="" className="mt-3 aspect-[2/1] w-full rounded-xl object-cover" />}
            {image && <GhostButton className="mt-3" onClick={() => { setImage(""); setEditor({ ...editor, imagen_url: null }); }}>Quitar foto</GhostButton>}
          </Field>
          <div className="space-y-4">
            <Field label="Marca"><input className={inputClass} value={editor.marca} onChange={(event) => setEditor({ ...editor, marca: event.target.value })} required /></Field>
            <Field label="Modelo"><input className={inputClass} value={editor.modelo} onChange={(event) => setEditor({ ...editor, modelo: event.target.value })} required /></Field>
          </div>
          <Field label="Año"><input className={inputClass} type="number" value={editor.anio ?? ""} onChange={(event) => setEditor({ ...editor, anio: event.target.value })} /></Field>
          <Field label="Patente" hint="Solo letras y números. Ej: AB123CD">
            <input className={inputClass} placeholder="AB123CD" value={editor.patente || ""} onChange={(event) => setEditor({ ...editor, patente: plateOnly(event.target.value) })} />
          </Field>
          <Field label="Kilometraje"><input className={inputClass} type="number" value={editor.kilometraje ?? 0} onChange={(event) => setEditor({ ...editor, kilometraje: event.target.value })} /></Field>
          <Field label="Motor" hint="Opcional. Se puede completar después.">
            <input className={inputClass} placeholder="Opcional" value={editor.motor || ""} onChange={(event) => setEditor({ ...editor, motor: event.target.value })} />
          </Field>
          <Field label="Transmisión" hint="Opcional. Se puede completar después.">
            <input className={inputClass} placeholder="Opcional" value={editor.transmision || ""} onChange={(event) => setEditor({ ...editor, transmision: event.target.value })} />
          </Field>
          <Field label="Modalidad">
            <select className={inputClass} value={editor.modalidad} onChange={(event) => setEditor({ ...editor, modalidad: event.target.value })}>
              {modalidades.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select className={inputClass} value={editor.estado} onChange={(event) => setEditor({ ...editor, estado: event.target.value })}>
              {ESTADOS_VEHICULO.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Moneda">
            <select className={inputClass} value={editor.moneda} onChange={(event) => setEditor({ ...editor, moneda: event.target.value })}>
              <option>USD</option>
              <option>ARS</option>
            </select>
          </Field>
          <Field label="Precio de compra" hint="Opcional. Se puede completar después.">
            <input className={inputClass} type="number" placeholder="Opcional" value={optionalNumber(editor.precio_compra)} onChange={(event) => setEditor({ ...editor, precio_compra: event.target.value })} />
          </Field>
          <Field label="Precio de venta"><input className={inputClass} type="number" value={optionalNumber(editor.precio_venta)} onChange={(event) => setEditor({ ...editor, precio_venta: event.target.value })} /></Field>
          <Field label="Gastos de preparación" hint="Opcional. Se puede completar después.">
            <input className={inputClass} type="number" placeholder="Opcional" value={optionalNumber(editor.gastos_preparacion)} onChange={(event) => setEditor({ ...editor, gastos_preparacion: event.target.value })} />
          </Field>
          <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
            <Field label="Dueño">
              <select className={inputClass} value={editor.cliente_duenio_id || ""} onChange={(event) => chooseOwner(event.target.value)}>
                <option value="">Sin ficha, escribir a mano</option>
                {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
              </select>
            </Field>
            <div className="flex items-end">
              <GhostButton onClick={() => setNewCliente("duenio")}>Agregar nueva ficha de cliente</GhostButton>
            </div>
            <Field label="Nombre del dueño" hint={ownerLocked ? "Sale de la ficha elegida." : "Solo si todavía no tiene ficha."}>
              <input className={inputClass} value={editor.duenio_nombre || ""} disabled={ownerLocked} onChange={(event) => setEditor({ ...editor, duenio_nombre: event.target.value })} />
            </Field>
            <Field label="Teléfono del dueño" hint="Ej: 1150649934. Sin +54.">
              <input className={inputClass} inputMode="numeric" placeholder="1150649934" value={editor.duenio_telefono || ""} disabled={ownerLocked} onChange={(event) => setEditor({ ...editor, duenio_telefono: phoneLocal(event.target.value) })} />
            </Field>
            <Field label="Comprador">
              <select className={inputClass} value={editor.cliente_comprador_id || ""} onChange={(event) => setEditor({ ...editor, cliente_comprador_id: event.target.value || null })}>
                <option value="">Sin comprador</option>
                {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
              </select>
            </Field>
            <div className="flex items-end">
              <GhostButton onClick={() => setNewCliente("comprador")}>Agregar nueva ficha de cliente</GhostButton>
            </div>
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-4 text-sm">
            {[["detailing", "Detailing"], ["fotos", "Fotos"], ["publicado", "Publicado"]].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={Boolean(editor.checklist?.[key])} onChange={(event) => setEditor({ ...editor, checklist: { ...editor.checklist, [key]: event.target.checked } })} />
                {label}
              </label>
            ))}
          </div>
          <Field label="Notas"><textarea className={`${inputClass} min-h-24`} value={editor.notas || ""} onChange={(event) => setEditor({ ...editor, notas: event.target.value })} /></Field>
          <div className="sm:col-span-2 flex flex-wrap justify-between gap-2">
            {exists && (
              <GhostButton onClick={() => { if (window.confirm("¿Eliminar este vehículo de este dispositivo?")) { remove("vehiculos", editor.id); removeImage(editor.id); onClose(); } }}>Eliminar</GhostButton>
            )}
            <PrimaryButton type="submit" className="ml-auto">Guardar</PrimaryButton>
          </div>
        </form>
      </Modal>
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onClose={() => setCropSrc("")}
          onConfirm={(dataUrl) => {
            setImage(dataUrl);
            setEditor((current) => ({ ...current, imagen_url: dataUrl }));
            setCropSrc("");
          }}
        />
      )}
      {newCliente && (
        <ClienteEditor
          initial={blankCliente(user?.id)}
          onClose={() => setNewCliente(null)}
          onSaved={(cliente) => {
            if (newCliente === "comprador") setEditor((current) => ({ ...current, cliente_comprador_id: cliente.id }));
            else setEditor((current) => ({ ...current, cliente_duenio_id: cliente.id, duenio_nombre: cliente.nombre, duenio_telefono: cliente.telefono || "" }));
            setNewCliente(null);
          }}
        />
      )}
    </>
  );
}
