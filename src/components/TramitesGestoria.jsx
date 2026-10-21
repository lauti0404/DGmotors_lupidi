import { useRef } from "react";
import { TRAMITES_GESTORIA, resumenTramites, tramitesDe } from "../lib/constants";

export function TitulosObtenidos({ checklist }) {
  const { obtenidos, pendientes } = resumenTramites(checklist);
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300">Títulos ya obtenidos:</p>
      <div className="flex flex-wrap gap-2">
        {obtenidos.length === 0 ? <span className="text-xs text-[#A1A1AA]">Todavía ninguno</span> : obtenidos.map((item) => (
          <span key={item.key} className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100">{item.label}</span>
        ))}
      </div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-amber-200">Pendientes:</p>
      <div className="flex flex-wrap gap-2">
        {pendientes.length === 0 ? <span className="text-xs text-[#A1A1AA]">Sin pendientes</span> : pendientes.map((item) => (
          <span key={item.key} className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-100">{item.label}</span>
        ))}
      </div>
    </div>
  );
}

export function TramitesGestoria({ checklist, documentos = [], onChange, onAdd, onOpen, onDelete }) {
  const inputRef = useRef(null);
  const tipoRef = useRef("");
  const tramites = tramitesDe(checklist);

  function update(key, patch) {
    const next = tramitesDe(checklist);
    const item = TRAMITES_GESTORIA.find((row) => row.key === key);
    const current = next[key];
    const merged = { ...current, ...patch };
    if (item?.requerido) merged.activo = true;
    if (!merged.activo) merged.obtenido = false;
    if (merged.obtenido) merged.activo = true;
    next[key] = merged;
    onChange({ ...(checklist || {}), tramites: next });
  }

  function pedirFoto(label) {
    tipoRef.current = label;
    inputRef.current?.click();
  }

  async function onFiles(event) {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    const tipo = tipoRef.current;
    if (tipo && files.length) await onAdd(tipo, files);
  }

  return (
    <div className="space-y-3">
      <input ref={inputRef} className="hidden" type="file" accept="image/*" multiple onChange={onFiles} />
      <div className="grid gap-2 sm:grid-cols-2">
        {TRAMITES_GESTORIA.map((item) => {
          const row = tramites[item.key];
          const fotos = documentos.filter((doc) => doc.tipo_documento === item.label && doc.url_archivo);
          return (
            <div key={item.key} className={`rounded-xl border p-3 ${row.obtenido ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10 bg-[#0A0A0A]"}`}>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={row.activo}
                  disabled={item.requerido}
                  onChange={(event) => update(item.key, { activo: event.target.checked })}
                />
                <span>
                  {item.label}
                  {item.requerido && <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-[#A1A1AA]">Incluido siempre</span>}
                </span>
              </label>
              {row.activo && (
                <label className="mt-2 flex items-center gap-2 text-xs text-[#A1A1AA]">
                  <input type="checkbox" checked={row.obtenido} onChange={(event) => update(item.key, { obtenido: event.target.checked })} />
                  Ya obtenido
                </label>
              )}
              <button type="button" className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs text-[#A1A1AA] hover:border-white/30 hover:text-white" onClick={() => pedirFoto(item.label)}>
                📷 Adjuntar / Ver Foto
              </button>
              {fotos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {fotos.map((doc) => (
                    <div key={doc.id} className="relative">
                      <button type="button" className="block h-16 w-16 overflow-hidden rounded-lg border border-white/10" onClick={() => onOpen(doc)} aria-label={`Ver foto de ${item.label}`}>
                        {String(doc.url_archivo).startsWith("data:image/") ? <img src={doc.url_archivo} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[10px] text-[#A1A1AA]">Foto</span>}
                      </button>
                      <button type="button" className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#141414] text-xs text-white" onClick={() => onDelete(doc)} aria-label="Eliminar foto">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <TitulosObtenidos checklist={{ ...(checklist || {}), tramites }} />
    </div>
  );
}
