import { useState } from "react";
import { useAuth } from "../context/Auth";
import { useData } from "../context/Data";
import { TIPOS_IMAGEN_CLIENTE } from "../lib/constants";
import { readDocumentFile } from "../lib/images";
import { ArchivoViewer } from "./ArchivoViewer";
import { SelectorArchivo } from "./SelectorArchivo";

export function ClienteImagenes({ clienteId }) {
  const { user } = useAuth();
  const { cliente_imagenes = [], perfiles = [], save, remove } = useData();
  const [tipo, setTipo] = useState("DNI Frente");
  const [error, setError] = useState("");
  const [viewer, setViewer] = useState(null);
  const rows = cliente_imagenes.filter((item) => item.cliente_id === clienteId);

  function choose(next) {
    setTipo(next);
    setError("");
  }

  async function onFile(file) {
    if (!file) return;
    try {
      const result = await readDocumentFile(file);
      const current = tipo === "Otro" ? null : rows.find((item) => item.tipo_imagen === tipo);
      const known = perfiles.some((item) => item.id === user?.id);
      save("cliente_imagenes", {
        id: current?.id || crypto.randomUUID(),
        cliente_id: clienteId,
        tipo_imagen: tipo,
        url_imagen: result.dataUrl,
        subido_por: known ? user.id : null,
        creado_en: current?.creado_en || new Date().toISOString(),
      });
      setError("");
    } catch (caught) {
      setError(caught.message);
    }
  }

  return (
    <section>
      <h3 className="font-display uppercase tracking-wide">Documentos</h3>
      <p className="mt-1 text-xs text-[#A1A1AA]">Elegí el dato y después la foto desde galería, fotos, cámara o archivos.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TIPOS_IMAGEN_CLIENTE.map((item) => (
          <button key={item} type="button" onClick={() => choose(item)} className={`rounded-lg border px-3 py-2 text-xs ${tipo === item ? "border-[#DC2626] text-white" : "border-white/10 bg-[#0A0A0A] text-[#A1A1AA] hover:border-white/30 hover:text-white"}`}>
            {rows.some((row) => row.tipo_imagen === item) ? `${item} · cargado` : item}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <SelectorArchivo pdf onFile={onFile} />
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      {rows.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {rows.map((item) => {
            const image = String(item.url_imagen || "").startsWith("data:image/");
            return (
              <article key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
                <button type="button" className="block w-full" onClick={() => setViewer(item)}>
                  {image ? <img src={item.url_imagen} alt="" className="aspect-[4/3] w-full object-cover" /> : <span className="grid aspect-[4/3] place-items-center text-xs text-[#A1A1AA]">PDF</span>}
                </button>
                <div className="flex items-center justify-between gap-2 px-2 py-2 text-[11px]">
                  <span className="truncate">{item.tipo_imagen}</span>
                  <button type="button" className="text-[#A1A1AA] hover:text-white" onClick={() => remove("cliente_imagenes", item.id)}>Quitar</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {viewer && <ArchivoViewer src={viewer.url_imagen} name={viewer.tipo_imagen} onClose={() => setViewer(null)} />}
    </section>
  );
}
