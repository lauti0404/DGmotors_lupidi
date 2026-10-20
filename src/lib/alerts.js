import { formatDate } from "./format";

const KEY = "dg_alertas";

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stamp(row, fallback) {
  return row?.actualizado_en || row?.creado_en || row?.fecha_ingreso || row?.ultimo_servicio || fallback;
}

function tooOld(alert, nowMs) {
  const start = new Date(alert.cuando).getTime();
  if (!Number.isFinite(start)) return false;
  const days = alert.tone === "danger" ? 183 : 365;
  return nowMs - start > days * 24 * 60 * 60 * 1000;
}

function persist(rows) {
  const nowMs = Date.now();
  const kept = rows.filter((alert) => !(alert.resuelto_en && tooOld(alert, nowMs)));
  for (const alert of kept) {
    if (tooOld(alert, nowMs)) alert.oculto = true;
  }
  kept.sort((a, b) => String(b.cuando).localeCompare(String(a.cuando)));
  localStorage.setItem(KEY, JSON.stringify(kept));
  return kept.filter((alert) => !alert.oculto);
}

export function dismissAlert(id) {
  return persist(load().map((alert) => (alert.id === id ? { ...alert, oculto: true } : alert)));
}

export function syncAlerts({ vehiculos = [], gestiones = [], clientes = [] }) {
  const now = new Date().toISOString();
  const previous = new Map(load().map((alert) => [alert.id, alert]));
  const active = [];

  for (const cliente of clientes) {
    const total = Number(cliente.lavados_totales) || 0;
    if (cliente.membresia === "Ninguna" || total <= 0 || Number(cliente.lavados_usados) < total) continue;
    active.push({
      id: `membresia:${cliente.id}`,
      tone: "danger",
      kicker: "Urgente",
      text: `${cliente.nombre} consumió la membresía ${cliente.membresia}.`,
      detalle: cliente.ultimo_servicio ? `Último lavado el ${formatDate(cliente.ultimo_servicio)}.` : "Se agotaron los lavados del plan.",
      cuando: stamp(cliente, now),
    });
  }

  for (const gestion of gestiones) {
    if (gestion.pagado || ["Finalizado", "Listo"].includes(gestion.etapa)) continue;
    active.push({
      id: `impago:${gestion.id}`,
      tone: "danger",
      kicker: gestion.sector === "Detailing" ? "Impago" : "Gestoría impaga",
      text: `${gestion.titulo || "Sin título"} sigue sin cobrar.`,
      detalle: gestion.fecha_ingreso ? `Ingresó el ${formatDate(gestion.fecha_ingreso)}.` : "Sin fecha de ingreso.",
      cuando: gestion.fecha_ingreso ? `${String(gestion.fecha_ingreso).slice(0, 10)}T12:00:00` : stamp(gestion, now),
    });
  }

  for (const vehicle of vehiculos) {
    if (vehicle.estado !== "Reservado") continue;
    active.push({
      id: `reserva:${vehicle.id}`,
      tone: "warn",
      kicker: "Reserva",
      text: `${vehicle.marca} ${vehicle.modelo} está reservado.`,
      detalle: vehicle.patente ? `Patente ${vehicle.patente}.` : "Sigue en reserva.",
      cuando: stamp(vehicle, now),
    });
  }

  const seen = new Set();
  const next = active.map((alert) => {
    seen.add(alert.id);
    const old = previous.get(alert.id);
    return {
      ...alert,
      cuando: old && !old.resuelto_en ? old.cuando : (alert.cuando || now),
      resuelto_en: null,
      oculto: Boolean(old?.oculto),
    };
  });

  for (const old of previous.values()) {
    if (seen.has(old.id) || old.oculto) continue;
    next.push({ ...old, resuelto_en: old.resuelto_en || now });
  }

  return persist(next);
}
