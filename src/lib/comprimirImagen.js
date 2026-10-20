const MAX_LADO = 1000;
const MAX_BYTES = 100 * 1024;

function bytesOf(dataUrl) {
  const base64 = String(dataUrl).split(",")[1] || "";
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function scaleCanvas(source, maxSide) {
  const longest = Math.max(source.width, source.height);
  if (longest <= maxSide) return source;
  const scale = maxSide / longest;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function encode(canvas, quality) {
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) return webp;
  return canvas.toDataURL("image/jpeg", quality);
}

export function comprimirCanvas(source) {
  let canvas = scaleCanvas(source, MAX_LADO);
  let quality = 0.7;
  let dataUrl = encode(canvas, quality);
  while (bytesOf(dataUrl) > MAX_BYTES && quality > 0.45) {
    quality = Math.round((quality - 0.05) * 100) / 100;
    dataUrl = encode(canvas, quality);
  }
  while (bytesOf(dataUrl) > MAX_BYTES && Math.max(canvas.width, canvas.height) > 480) {
    canvas = scaleCanvas(canvas, Math.round(Math.max(canvas.width, canvas.height) * 0.85));
    dataUrl = encode(canvas, quality);
  }
  return dataUrl;
}

export function comprimirImagenDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) {
      reject(new Error("Subí una foto."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("El archivo no es una imagen."));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext("2d").drawImage(image, 0, 0);
        resolve(comprimirCanvas(canvas));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}
