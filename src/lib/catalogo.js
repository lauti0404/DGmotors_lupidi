export const DURACIONES_MEMBRESIA = ["Mensual", "Trimestral", "Semestral", "Anual"];

function itemId(number) {
  return `b2000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
}

const PACK_BASE = [
  {
    id: "b1000000-0000-4000-8000-000000000001",
    nombre: "Basic Pack",
    subtitulo: "Detail básico (mantenimiento)",
    precio: 95000,
    moneda: "ARS",
    orden: 1,
    items: ["Limpieza de llantas", "Limpieza a detalle de carrocería", "Encerado", "Aspirado interior profundo", "Limpieza de tablero y consola central"],
  },
  {
    id: "b1000000-0000-4000-8000-000000000002",
    nombre: "Exclusive Pack",
    subtitulo: "Detail profundo",
    precio: 165000,
    moneda: "ARS",
    orden: 2,
    items: ["Limpieza de llantas", "Limpieza a detalle de carrocería", "Encerado", "Aspirado interior profundo", "Limpieza de tablero y consola central", "Limpieza de paneles de puerta", "Limpieza de tapizados/hidratación de cuero", "Acondicionado de plásticos interiores"],
  },
  {
    id: "b1000000-0000-4000-8000-000000000003",
    nombre: "Master Pack",
    subtitulo: "",
    precio: 260000,
    moneda: "ARS",
    orden: 3,
    items: ["Aspirado profundo", "Detallado/acondicionado de plásticos", "Detallado de llantas", "Limpieza de carrocería a detalle", "Descontaminado de carrocería", "Abrillantado de carrocería (pulido + brillo + sellado)"],
  },
  {
    id: "b1000000-0000-4000-8000-000000000004",
    nombre: "Ultra Pack",
    subtitulo: "",
    precio: 540000,
    moneda: "ARS",
    orden: 4,
    items: ["Aspirado profundo", "Detallado/acondicionado de plásticos", "Detallado de llantas", "Limpieza de carrocería a detalle", "Descontaminado de carrocería", "Abrillantado de carrocería (pulido + brillo + sellado)", "Tratamiento cerámico (protección de 1 a 3 años), repelencia al agua, polvo y protección de micro rayas"],
  },
];

let itemSerial = 1;
export const PACKS_INICIAL = PACK_BASE.map(({ items, ...pack }) => pack);
export const ITEMS_INICIAL = PACK_BASE.flatMap((pack) => pack.items.map((descripcion) => ({
  id: itemId(itemSerial++),
  pack_id: pack.id,
  descripcion_item: descripcion,
  orden: pack.items.indexOf(descripcion) + 1,
})));

export const EXTRAS_INICIAL = [
  { id: "b1000000-0000-4000-8000-000000000005", nombre: "Limpieza de motor", descripcion: "Limpieza de motor", moneda: "ARS", precio: 0 },
  { id: "b1000000-0000-4000-8000-000000000006", nombre: "Limpieza de tapizado", descripcion: "Limpieza de tapizado", moneda: "ARS", precio: 0 },
  { id: "b1000000-0000-4000-8000-000000000007", nombre: "Pulido de ópticas", descripcion: "Pulido de ópticas", moneda: "ARS", precio: 0 },
];

export const MEMBRESIAS_INICIAL = [
  { id: "b1000000-0000-4000-8000-000000000008", nombre: "Stone", duracion: "Mensual", lavados_totales: 2, detalle_packs: "1 exclusive pack (detail profundo)\n1 basic pack (detail de mantenimiento)", moneda: "ARS", precio: 0 },
  { id: "b1000000-0000-4000-8000-000000000009", nombre: "Bronze", duracion: "Mensual", lavados_totales: 3, detalle_packs: "1 exclusive pack (detail profundo)\n2 basic pack (detail de mantenimiento)", moneda: "ARS", precio: 0 },
  { id: "b1000000-0000-4000-8000-00000000000a", nombre: "Silver", duracion: "Trimestral", lavados_totales: 6, detalle_packs: "3 exclusive pack (detail profundo)\n3 basic pack (detail de mantenimiento)", moneda: "ARS", precio: 0 },
  { id: "b1000000-0000-4000-8000-00000000000b", nombre: "Gold", duracion: "Trimestral", lavados_totales: 9, detalle_packs: "3 exclusive pack (detail profundo)\n6 basic pack (detail de mantenimiento)", moneda: "ARS", precio: 0 },
  { id: "b1000000-0000-4000-8000-00000000000c", nombre: "Diamond", duracion: "Semestral", lavados_totales: 11, detalle_packs: "Ultra pack (protección de 1 a 3 años)\n5 exclusive pack (detail profundo)\n6 basic pack (detail de mantenimiento)", moneda: "ARS", precio: 0 },
];

export function filasVisibles(rows, seeds) {
  const list = rows?.length ? rows : seeds;
  return [...list].sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0) || String(a.nombre || "").localeCompare(String(b.nombre || "")));
}

export function itemsDelPack(packId, items, usandoSemilla) {
  const source = usandoSemilla ? ITEMS_INICIAL : items;
  return source.filter((item) => item.pack_id === packId).sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
}

export function membresiaVencida(cliente) {
  const total = Number(cliente?.lavados_totales) || 0;
  const used = Number(cliente?.lavados_usados) || 0;
  if (!cliente?.membresia || cliente.membresia === "Ninguna" || total <= 0 || used < total) return false;
  const raw = cliente.ultimo_servicio || cliente.actualizado_en;
  if (!raw) return false;
  const start = new Date(String(raw).length <= 10 ? `${raw}T12:00:00` : raw);
  if (Number.isNaN(start.getTime())) return false;
  const limit = new Date(start);
  limit.setMonth(limit.getMonth() + 4);
  return Date.now() >= limit.getTime();
}

export function sinMembresia(cliente) {
  return { ...cliente, membresia: "Ninguna", lavados_usados: 0, lavados_totales: 0 };
}
