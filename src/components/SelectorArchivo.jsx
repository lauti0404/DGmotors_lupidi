import { useRef } from "react";

const FOTOS = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/*";

export function SelectorArchivo({ onFile, pdf = false }) {
  const fotosRef = useRef(null);
  const camaraRef = useRef(null);
  const archivosRef = useRef(null);

  function take(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onFile(file);
  }

  const button = "rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-xs text-[#A1A1AA] hover:border-white/30 hover:text-white";

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} onClick={() => fotosRef.current?.click()}>Galería y fotos</button>
        <button type="button" className={button} onClick={() => camaraRef.current?.click()}>Cámara</button>
        <button type="button" className={button} onClick={() => archivosRef.current?.click()}>Archivos</button>
      </div>
      <input ref={fotosRef} className="hidden" type="file" accept={FOTOS} onChange={take} />
      <input ref={camaraRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={take} />
      <input ref={archivosRef} className="hidden" type="file" accept={pdf ? `${FOTOS},.pdf,application/pdf` : FOTOS} onChange={take} />
    </div>
  );
}
