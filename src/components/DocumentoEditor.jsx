import { useState } from "react";
import { ESTADOS_DOCUMENTO, TIPOS_DOCUMENTO } from "../lib/constants";
import { readDocumentFile } from "../lib/images";
import { Field, GhostButton, Modal, PrimaryButton, inputClass } from "./ui";

export function DocumentoEditor({ initial, onClose, onSaved, onDelete }) {
  const [editor, setEditor] = useState(initial);
  const [error, setError] = useState("");
  const isImage = String(editor.url_archivo || "").startsWith("data:image/");

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const result = await readDocumentFile(file);
      setEditor((current) => ({ ...current, url_archivo: result.dataUrl, nombre_archivo: result.name, estado_documento: current.estado_documento === "Pendiente" ? "Recibido" : current.estado_documento }));
      setError("");
    } catch (caught) {
      setError(caught.message);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (!editor.tipo_documento) return;
    onSaved(editor);
  }

  return (
    <Modal title="Documento de gestoría" subtitle="La foto o el PDF queda en la gestión y lo puede ver todo el equipo." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 p-5">
        <Field label="Dato con el que contás">
          <select className={inputClass} value={editor.tipo_documento} onChange={(event) => setEditor({ ...editor, tipo_documento: event.target.value })}>
            {TIPOS_DOCUMENTO.map((tipo) => <option key={tipo}>{tipo}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select className={inputClass} value={editor.estado_documento || "Recibido"} onChange={(event) => setEditor({ ...editor, estado_documento: event.target.value })}>
            {ESTADOS_DOCUMENTO.map((estado) => <option key={estado}>{estado}</option>)}
          </select>
        </Field>
        <Field label="Archivo" hint="Foto o PDF. Si es una foto, se achica para que se pueda ver y descargar.">
          <input className={inputClass} type="file" accept="image/*,.pdf,application/pdf" onChange={onFile} />
        </Field>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {isImage && <img src={editor.url_archivo} alt="" className="max-h-64 w-full rounded-xl object-contain bg-black" />}
        {editor.url_archivo && !isImage && <p className="text-sm text-[#A1A1AA]">PDF listo: {editor.nombre_archivo || "documento.pdf"}</p>}
        <Field label="Observaciones">
          <textarea className={`${inputClass} min-h-20`} value={editor.observaciones || ""} onChange={(event) => setEditor({ ...editor, observaciones: event.target.value })} />
        </Field>
        <div className="flex flex-wrap justify-between gap-2">
          {onDelete && <GhostButton onClick={onDelete}>Quitar documento</GhostButton>}
          <div className="ml-auto flex gap-2">
            <GhostButton onClick={onClose}>Cancelar</GhostButton>
            <PrimaryButton type="submit">Guardar documento</PrimaryButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}
