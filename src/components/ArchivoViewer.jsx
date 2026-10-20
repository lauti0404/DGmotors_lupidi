import { useState } from "react";
import { downloadData } from "../lib/files";
import { GhostButton, Modal, PrimaryButton } from "./ui";

export function ArchivoViewer({ src, name, onClose }) {
  const [zoom, setZoom] = useState(1);
  const isImage = String(src || "").startsWith("data:image/");

  return (
    <Modal wide title={name || "Archivo"} subtitle="Se abre acá para verla completa. El zoom la acerca." onClose={onClose}>
      <div className="space-y-4 p-5">
        {isImage ? (
          <div className="max-h-[70vh] overflow-auto rounded-xl bg-black">
            <img src={src} alt="" className="mx-auto origin-top transition-transform" style={{ transform: `scale(${zoom})` }} />
          </div>
        ) : (
          <p className="text-sm text-[#A1A1AA]">Este archivo es un PDF. Descargalo para abrirlo.</p>
        )}
        {isImage && (
          <label className="block text-xs text-[#A1A1AA]">
            Acercar
            <input className="mt-2 w-full accent-[#DC2626]" type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
          </label>
        )}
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cerrar</GhostButton>
          <PrimaryButton onClick={() => downloadData(src, name || (isImage ? "imagen.jpg" : "archivo.pdf"))}>Descargar</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
