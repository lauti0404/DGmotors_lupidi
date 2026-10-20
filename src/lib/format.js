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
  return String(value || "").replace(/\D/g, "").slice(0, max);
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
