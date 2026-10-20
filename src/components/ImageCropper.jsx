import { useEffect, useRef, useState } from "react";
import { comprimirCanvas } from "../lib/comprimirImagen";
import { GhostButton, Modal, PrimaryButton } from "./ui";

function frameSize(width, ratio) {
  return { w: width, h: width / ratio };
}

function placement(natural, frame, zoom, offset) {
  const cover = Math.max(frame.w / natural.w, frame.h / natural.h);
  const scale = cover * zoom;
  const dw = natural.w * scale;
  const dh = natural.h * scale;
  const x = Math.min(0, Math.max(frame.w - dw, offset.x));
  const y = Math.min(0, Math.max(frame.h - dh, offset.y));
  return { scale, dw, dh, x, y };
}

export function ImageCropper({ src, onClose, onConfirm, shape = "wide" }) {
  const ratio = shape === "circle" ? 1 : 2;
  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const drag = useRef(null);
  const moved = useRef(false);
  const [natural, setNatural] = useState(null);
  const [frameW, setFrameW] = useState(640);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return undefined;
    const update = () => setFrameW(node.clientWidth || 640);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setNatural({ w: image.naturalWidth, h: image.naturalHeight });
    };
    image.src = src;
  }, [src]);

  useEffect(() => {
    if (!natural || moved.current) return;
    const frame = frameSize(frameW, ratio);
    const next = placement(natural, frame, 1, { x: -99999, y: -99999 });
    setOffset({ x: (frame.w - next.dw) / 2, y: (frame.h - next.dh) / 2 });
  }, [natural, frameW, ratio]);

  function currentFrame() {
    return frameSize(frameRef.current?.clientWidth || frameW, ratio);
  }

  function moveTo(next, nextZoom = zoom) {
    if (!natural) return;
    const placed = placement(natural, currentFrame(), nextZoom, next);
    setOffset({ x: placed.x, y: placed.y });
  }

  function onPointerDown(event) {
    moved.current = true;
    drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!drag.current) return;
    moveTo({
      x: drag.current.ox + event.clientX - drag.current.x,
      y: drag.current.oy + event.clientY - drag.current.y,
    });
  }

  function confirmCrop() {
    const image = imageRef.current;
    const frame = currentFrame();
    if (!image || !natural) return;
    const placed = placement(natural, frame, zoom, offset);
    const sx = -placed.x / placed.scale;
    const sy = -placed.y / placed.scale;
    const sw = frame.w / placed.scale;
    const sh = frame.h / placed.scale;
    const canvas = document.createElement("canvas");
    canvas.width = shape === "circle" ? 800 : 1200;
    canvas.height = shape === "circle" ? 800 : 600;
    canvas.getContext("2d").drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    onConfirm(comprimirCanvas(canvas));
  }

  const frame = currentFrame();
  const placed = natural ? placement(natural, frame, zoom, offset) : null;

  return (
    <Modal wide title="Elegí qué parte se ve" subtitle={shape === "circle" ? "Arrastrá la foto. El círculo es el que va a verse de perfil." : "Arrastrá la foto y ajustá el zoom. El recuadro es el que va a verse en la ficha."} onClose={onClose}>
      <div className="space-y-4 p-5">
        <div
          ref={frameRef}
          className={`relative w-full cursor-grab overflow-hidden bg-black active:cursor-grabbing ${shape === "circle" ? "mx-auto aspect-square max-w-sm rounded-full" : "aspect-[2/1] rounded-xl"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
        >
          {placed && (
            <img
              src={src}
              alt=""
              draggable="false"
              className="pointer-events-none absolute max-w-none select-none"
              style={{ width: placed.dw, height: placed.dh, left: placed.x, top: placed.y }}
            />
          )}
          <div className={`pointer-events-none absolute border border-white/70 ${shape === "circle" ? "inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,.35)]" : "inset-3 rounded-lg"}`} />
        </div>
        <label className="block text-xs text-[#A1A1AA]">
          Zoom
          <input className="mt-2 w-full accent-[#DC2626]" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => {
            const nextZoom = Number(event.target.value);
            setZoom(nextZoom);
            moveTo(offset, nextZoom);
          }} />
        </label>
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <PrimaryButton onClick={confirmCrop}>Usar este recorte</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
