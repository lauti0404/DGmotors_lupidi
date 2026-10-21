import { useRef, useState } from "react";
import { TRAMITES_GESTORIA, resumenTramites, tramitesDe } from "../lib/constants";
import { GhostButton, Modal, PrimaryButton } from "./ui";

function fotosDe(documentos, label) {
  return (documentos || []).filter((doc) => doc.tipo_documento === label && doc.url_archivo);
}

function Miniaturas({ fotos, onOpen, onRemove, onReplace }) {
  if (!fotos.length) return <p className="text-sm text-[#A1A1AA]">Todavía no hay imágenes.</p>;
  return (
    <div className="flex flex-wrap gap-3">
      {fotos.map((doc) => (
        <div key={doc.id} className="space-y-1">
          <button type="button" className="block h-20 w-20 overflow-hidden rounded-lg border border-white/10" onClick={() => onOpen?.(doc)} aria-label="Ver imagen">
            {String(doc.url_archivo).startsWith("data:image/") ? <img src={doc.url_archivo} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[10px] text-[#A1A1AA]">Foto</span>}
          </button>
          {(onRemove || onReplace) && (
            <div className="flex gap-1">
              {onReplace && <button type="button" className="text-[10px] uppercase tracking-[0.08em] text-[#A1A1AA] hover:text-white" onClick={() => onReplace(doc)}>Cambiar</button>}
              {onRemove && <button type="button" className="text-[10px] uppercase tracking-[0.08em] text-[#A1A1AA] hover:text-white" onClick={() => onRemove(doc)}>Sacar</button>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function TitulosObtenidos({ checklist, documentos = [], onChange, onAdd, onOpen, onDeleteFoto, onDeleteFotos }) {
  const { obtenidos, pendientes } = resumenTramites(checklist);
  const [menu, setMenu] = useState(null);
  const inputRef = useRef(null);
  const reemplazoRef = useRef(null);
  const reemplazoId = useRef("");
  const fotos = menu ? fotosDe(documentos, menu.label) : [];

  function cambiar(key, obtenido) {
    const tramites = tramitesDe(checklist);
    tramites[key] = { activo: true, obtenido };
    onChange?.({ ...(checklist || {}), tramites });
  }

  async function onFiles(event) {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (menu && files.length) await onAdd?.(menu.label, files);
  }

  async function onReemplazo(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const id = reemplazoId.current;
    reemplazoId.current = "";
    const actual = fotos.find((doc) => doc.id === id);
    if (!file || !menu || !actual) return;
    await onAdd?.(menu.label, [file]);
    onDeleteFoto?.(actual);
  }

  function pedirCambio(doc) {
    reemplazoId.current = doc.id;
    reemplazoRef.current?.click();
  }

  function sacarFoto(doc) {
    if (!window.confirm("¿Sacar esta imagen?")) return;
    onDeleteFoto?.(doc);
  }

  function pasarAPendiente() {
    if (!menu) return;
    if (fotos.length && !window.confirm("¿Pasarlo a pendientes y borrar las imágenes?")) return;
    onDeleteFotos?.(menu.label);
    cambiar(menu.key, false);
    setMenu(null);
  }

  function marcarObtenido() {
    if (!menu) return;
    cambiar(menu.key, true);
    setMenu(null);
  }

  return (
    <div className="space-y-2">
      <input ref={inputRef} className="hidden" type="file" accept="image/*" multiple onChange={onFiles} />
      <input ref={reemplazoRef} className="hidden" type="file" accept="image/*" onChange={onReemplazo} />
      <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300">Títulos ya obtenidos:</p>
      <div className="flex flex-wrap gap-2">
        {obtenidos.length === 0 ? <span className="text-xs text-[#A1A1AA]">Todavía ninguno</span> : obtenidos.map((item) => (
          <button key={item.key} type="button" className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100" onClick={() => setMenu({ ...item, modo: "obtenido" })}>{item.label}</button>
        ))}
      </div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-amber-200">Pendientes:</p>
      <div className="flex flex-wrap gap-2">
        {pendientes.length === 0 ? <span className="text-xs text-[#A1A1AA]">Sin pendientes</span> : pendientes.map((item) => (
          <button key={item.key} type="button" className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-100" onClick={() => setMenu({ ...item, modo: "pendiente" })}>{item.label}</button>
        ))}
      </div>
      {menu?.modo === "pendiente" && (
        <Modal title={menu.label} subtitle="Pendiente" onClose={() => setMenu(null)}>
          <div className="space-y-4 p-5">
            <p className="text-sm text-[#A1A1AA]">La imagen es opcional. Si la cargás, queda adjunta a este trámite.</p>
            <GhostButton onClick={() => inputRef.current?.click()}>Adjuntar imagen</GhostButton>
            <Miniaturas fotos={fotos} onOpen={onOpen} />
            <PrimaryButton onClick={marcarObtenido}>Título ya obtenido</PrimaryButton>
          </div>
        </Modal>
      )}
      {menu?.modo === "obtenido" && (
        <Modal title={menu.label} subtitle="Título ya obtenido" onClose={() => setMenu(null)}>
          <div className="space-y-4 p-5">
            <GhostButton onClick={() => inputRef.current?.click()}>Adjuntar imagen</GhostButton>
            <Miniaturas fotos={fotos} onOpen={onOpen} onRemove={sacarFoto} onReplace={pedirCambio} />
            <GhostButton onClick={pasarAPendiente}>Pasar a pendientes</GhostButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function TramitesGestoria({ checklist, documentos = [], onChange, onAdd, onOpen, onDelete }) {
  const tramites = tramitesDe(checklist);

  function update(key, patch) {
    const next = tramitesDe(checklist);
    const current = next[key];
    const merged = { ...current, ...patch };
    if (!merged.activo) merged.obtenido = false;
    if (merged.obtenido) merged.activo = true;
    next[key] = merged;
    onChange({ ...(checklist || {}), tramites: next });
  }

  function borrarDelTipo(label) {
    for (const doc of fotosDe(documentos, label)) onDelete(doc);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {TRAMITES_GESTORIA.map((item) => {
          const row = tramites[item.key];
          return (
            <label key={item.key} className="flex items-start gap-2 rounded-xl border border-white/10 bg-[#0A0A0A] p-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={row.activo}
                onChange={(event) => update(item.key, { activo: event.target.checked })}
              />
              <span>{item.label}</span>
            </label>
          );
        })}
      </div>
      <TitulosObtenidos
        checklist={{ ...(checklist || {}), tramites }}
        documentos={documentos}
        onChange={onChange}
        onAdd={onAdd}
        onOpen={onOpen}
        onDeleteFoto={onDelete}
        onDeleteFotos={borrarDelTipo}
      />
    </div>
  );
}
