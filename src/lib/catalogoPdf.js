import { jsPDF } from "jspdf";
import { BUSINESS_IG, BUSINESS_PHONE, formatDate, formatKm, money, todayISO } from "./format";
import { vehiclePhoto } from "./images";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;
const GAP = 5;
const CARD_W = (PAGE_W - MARGIN * 2 - GAP) / 2;
const PHOTO_H = 38;
const LIMITE = PAGE_H - 16;

function dato(value) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function precioPublico(vehicle) {
  if (!Number(vehicle.precio_venta)) return "Consultar";
  return money(vehicle.precio_venta, vehicle.moneda);
}

function nombre(vehicle) {
  return `${vehicle.marca || ""} ${vehicle.modelo || ""}`.trim().toUpperCase() || "VEHÍCULO";
}

function fotoDe(vehicle) {
  if (vehicle?.imagen_url) return vehicle.imagen_url;
  try {
    return vehiclePhoto(vehicle);
  } catch {
    return "";
  }
}

function blobADataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function raster(src, ratio) {
  if (!src || typeof Image === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const sw0 = img.naturalWidth || img.width;
        const sh0 = img.naturalHeight || img.height;
        if (!sw0 || !sh0) {
          resolve(null);
          return;
        }
        let sx = 0;
        let sy = 0;
        let sw = sw0;
        let sh = sh0;
        if (ratio) {
          const actual = sw0 / sh0;
          if (actual > ratio) {
            sw = sh0 * ratio;
            sx = (sw0 - sw) / 2;
          } else {
            sh = sw0 / ratio;
            sy = (sh0 - sh) / 2;
          }
        }
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 900 / sw);
        canvas.width = Math.max(1, Math.round(sw * scale));
        canvas.height = Math.max(1, Math.round(sh * scale));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function cargarImagen(src, ratio) {
  if (!src || typeof document === "undefined") return null;
  try {
    let fuente = src;
    if (/^https?:/i.test(src)) {
      const response = await fetch(src);
      if (!response.ok) return null;
      fuente = await blobADataUrl(await response.blob());
    }
    return await raster(fuente, ratio);
  } catch {
    return null;
  }
}

function altoTarjeta(doc, vehicle) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const ancho = CARD_W - 8 - (String(vehicle.patente || "").trim() ? 26 : 0);
  const lineas = doc.splitTextToSize(nombre(vehicle), Math.max(28, ancho));
  return PHOTO_H + 4 + lineas.length * 5.2 + 3 + 18 + 9;
}

function encabezado(doc, { compacto, logo, fecha }) {
  if (compacto) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(24, 24, 27);
    doc.text("STOCK DISPONIBLE", MARGIN, MARGIN + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    doc.text(`${BUSINESS_PHONE}   ·   @${BUSINESS_IG}`, MARGIN, MARGIN + 8.5);
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.7);
    doc.line(MARGIN, MARGIN + 11, PAGE_W - MARGIN, MARGIN + 11);
    return MARGIN + 16;
  }

  let textX = MARGIN;
  if (logo) {
    doc.addImage(logo, "JPEG", MARGIN, MARGIN, 18, 18);
    textX = MARGIN + 22;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(24, 24, 27);
  doc.text("STOCK DISPONIBLE", textX, MARGIN + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(82, 82, 91);
  doc.text(`DG Motors  ·  ${fecha}`, textX, MARGIN + 12);
  doc.text(`${BUSINESS_PHONE}   ·   @${BUSINESS_IG}`, textX, MARGIN + 16.5);
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1);
  doc.line(MARGIN, MARGIN + 21, PAGE_W - MARGIN, MARGIN + 21);
  return MARGIN + 27;
}

function pie(doc) {
  const y = PAGE_H - 8;
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y - 4, PAGE_W - MARGIN, y - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(63, 63, 70);
  doc.text(`Consultas y reservas  ·  ${BUSINESS_PHONE}  ·  Instagram @${BUSINESS_IG}`, PAGE_W / 2, y, { align: "center" });
}

function patente(doc, text, x, y) {
  const label = String(text || "").trim().toUpperCase();
  if (!label) return;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const ancho = doc.getTextWidth(label) + 8;
  doc.setFillColor(29, 78, 216);
  doc.rect(x, y, 5.5, 5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.text("AR", x + 1, y + 3.4);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.rect(x + 5.5, y, ancho - 5.5, 5, "FD");
  doc.setTextColor(24, 24, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(label, x + 7, y + 3.5);
}

function ficha(doc, vehicle, x, y, alto, foto) {
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, CARD_W, alto, 1.6, 1.6);
  if (foto) {
    try {
      doc.addImage(foto, "JPEG", x + 0.4, y + 0.4, CARD_W - 0.8, PHOTO_H - 0.2);
    } catch {
      foto = "";
    }
  }
  if (!foto) {
    doc.setFillColor(244, 244, 245);
    doc.rect(x + 0.4, y + 0.4, CARD_W - 0.8, PHOTO_H - 0.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(161, 161, 170);
    doc.text("SIN FOTO", x + CARD_W / 2, y + PHOTO_H / 2, { align: "center" });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const titulo = nombre(vehicle);
  const lineas = doc.splitTextToSize(titulo, Math.max(28, CARD_W - 8 - (vehicle.patente ? 26 : 0)));
  doc.setTextColor(24, 24, 27);
  doc.text(lineas, x + 3, y + PHOTO_H + 6);
  patente(doc, vehicle.patente, x + CARD_W - 3 - Math.min(28, CARD_W / 2), y + PHOTO_H + 2.5);

  const campos = [
    ["AÑO", dato(vehicle.anio)],
    ["KILÓMETROS", formatKm(vehicle.kilometraje)],
    ["MOTOR", dato(vehicle.motor)],
    ["TRANSMISIÓN", dato(vehicle.transmision)],
  ];
  const specsY = y + PHOTO_H + 6 + lineas.length * 5.2 + 2;
  campos.forEach((campo, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const cx = x + 3 + col * ((CARD_W - 6) / 2);
    const cy = specsY + row * 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text(campo[0], cx, cy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(24, 24, 27);
    const valor = doc.splitTextToSize(String(campo[1]), (CARD_W - 10) / 2);
    doc.text(valor[0], cx, cy + 3.8);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(220, 38, 38);
  doc.text(precioPublico(vehicle), x + 3, y + alto - 4);
}

export async function generarCatalogoPdf(vehiculos) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: "Stock disponible · DG Motors",
    subject: "Catálogo de vehículos disponibles",
  });
  const fecha = formatDate(todayISO());
  const ratio = CARD_W / PHOTO_H;
  const [logo, ...fotos] = await Promise.all([
    cargarImagen("/logo.png", 1),
    ...vehiculos.map((vehicle) => cargarImagen(fotoDe(vehicle), ratio)),
  ]);

  let y = encabezado(doc, { compacto: false, logo, fecha });
  for (let index = 0; index < vehiculos.length; index += 2) {
    const izquierda = vehiculos[index];
    const derecha = vehiculos[index + 1];
    const alto = Math.max(altoTarjeta(doc, izquierda), derecha ? altoTarjeta(doc, derecha) : 0);
    if (y + alto > LIMITE) {
      pie(doc);
      doc.addPage();
      y = encabezado(doc, { compacto: true, logo, fecha });
    }
    ficha(doc, izquierda, MARGIN, y, alto, fotos[index]);
    if (derecha) ficha(doc, derecha, MARGIN + CARD_W + GAP, y, alto, fotos[index + 1]);
    y += alto + GAP;
  }
  pie(doc);
  return doc.output("blob");
}

export const NOMBRE_CATALOGO = "Stock-disponible-DG-Motors.pdf";
