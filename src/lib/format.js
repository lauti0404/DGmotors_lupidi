export const BUSINESS_WA = "5491150649934";
export const BUSINESS_PHONE = "+54 9 11 5064-9934";
export const BUSINESS_IG = "detailgarage_motors";

export function todayISO() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function money(value, currency = "ARS") {
  const amount = Number(value) || 0;
  const formatted = amount.toLocaleString(currency === "USD" ? "en-US" : "es-AR", { maximumFractionDigits: 0 });
  return currency === "USD" ? `USD $${formatted}` : `ARS $${formatted}`;
}

export function formatKm(value) {
  return `${Number(value || 0).toLocaleString("es-AR")} km`;
}

export function formatWhen(iso) {
  const value = String(iso || "");
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value) || value.endsWith("T12:00:00")) return formatDate(value);
  return formatDateTime(value);
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return formatDate(iso);
  return date.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso) {
  if (!iso) return "—";
  const [year, month, day] = String(iso).slice(0, 10).split("-");
  if (!year || !month || !day) return "—";
  return `${day}/${month}/${year}`;
}

export function digitsOnly(value, max) {
  const clean = String(value ?? "").replace(/\D/g, "");
  return max ? clean.slice(0, max) : clean;
}

export function dniCuit(value) {
  return digitsOnly(value, 11);
}

export function dniCuitError(value) {
  const digits = dniCuit(value);
  if (!digits) return "";
  if (digits.length === 7 || digits.length === 8 || digits.length === 11) return "";
  return "El DNI lleva 7 u 8 números. El CUIT, 11. Con otra cantidad no se guarda.";
}

export function phoneError(value) {
  const digits = phoneLocal(value);
  if (!digits) return "";
  if (digits.length === 10) return "";
  return "El teléfono lleva 10 números, sin el +54. Ej: 1150649934.";
}

export function plateError(value) {
  const plate = plateOnly(value);
  if (!plate) return "";
  if (plate.length === 6 || plate.length === 7) return "";
  return "La patente lleva 6 o 7 letras y números. Ej: AB123CD.";
}

export function emailError(value) {
  const email = String(value || "").trim();
  if (!email) return "";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return "El email tiene que ser como nombre@mail.com.";
}

export function yearOnly(value) {
  return digitsOnly(value, 4);
}

export function yearError(value) {
  const year = yearOnly(value);
  if (!year) return "";
  const number = Number(year);
  const max = new Date().getFullYear() + 1;
  if (year.length === 4 && number >= 1950 && number <= max) return "";
  return `El año tiene 4 números, entre 1950 y ${max}.`;
}

export function kmOnly(value) {
  return digitsOnly(value, 7);
}

export function amountOnly(value) {
  const digits = String(value ?? "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  return digits.slice(0, 10);
}

export function countOnly(value) {
  const digits = digitsOnly(value, 3);
  if (!digits) return "0";
  return String(Number(digits));
}

export function ticketOnly(value) {
  return String(value || "").replace(/[^0-9-]/g, "").slice(0, 17);
}

export function phoneLocal(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("54")) digits = digits.slice(2);
  if (digits.startsWith("9") && digits.length > 10) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function plateOnly(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

export function categoryList(value) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

export function waLink(phone, text) {
  const digits = phoneLocal(phone);
  if (!digits) return "";
  return `https://wa.me/549${digits}?text=${encodeURIComponent(text || "")}`;
}

export function balanceOf(rows, currency) {
  return rows
    .filter((row) => row.moneda === currency)
    .reduce((total, row) => total + (row.tipo === "Ingreso" ? 1 : -1) * (Number(row.monto) || 0), 0);
}

export function vehicleLabel(vehicle) {
  if (!vehicle) return "";
  return [vehicle.marca, vehicle.modelo, vehicle.anio].filter(Boolean).join(" ");
}

export function datosVehiculo(vehicle) {
  if (!vehicle) return "";
  return `${vehicleLabel(vehicle)} ${vehicle.patente || ""}`.trim();
}

export function vehiculoAsociado(clienteId, vehiculos = [], cliente) {
  if (!clienteId) return null;
  const propios = vehiculos.filter((item) => item.cliente_duenio_id === clienteId);
  if (!propios.length) return null;
  const patente = String(cliente?.patente || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
  const porPatente = patente && propios.find((item) => String(item.patente || "").replace(/[^a-z0-9]/gi, "").toUpperCase() === patente);
  return porPatente || propios.find((item) => item.estado !== "Vendido") || propios[0];
}
