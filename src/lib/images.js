import { comprimirImagenDataUrl } from "./comprimirImagen";

const KEY = "dg_vehicle_images";

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function vehiclePhoto(vehicle) {
  return vehicle?.imagen_url || loadImage(vehicle?.id) || "";
}

export function loadImage(id) {
  if (!id) return "";
  return readAll()[id] || "";
}

export function saveImage(id, dataUrl) {
  if (!id) return;
  const all = readAll();
  if (dataUrl) all[id] = dataUrl;
  else delete all[id];
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function removeImage(id) {
  saveImage(id, "");
}

export function readDocumentFile(file) {
  if (file.type === "application/pdf") {
    if (file.size > 1500000) return Promise.reject(new Error("El PDF pesa demasiado. Usá uno de menos de 1,5 MB."));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
      reader.onload = () => resolve({ dataUrl: String(reader.result || ""), name: file.name });
      reader.readAsDataURL(file);
    });
  }
  if (!file.type.startsWith("image/")) return Promise.reject(new Error("Subí una foto o un PDF."));
  return comprimirImagenDataUrl(file).then((dataUrl) => ({
    dataUrl,
    name: file.name.replace(/\.\w+$/, "") + (dataUrl.startsWith("data:image/webp") ? ".webp" : ".jpg"),
  }));
}

export function readImageFile(file) {
  return comprimirImagenDataUrl(file);
}
