import { CHECKLIST_VEHICULO, modalidadCanonica, tramitesDe } from "./constants";
import { dniCuit, phoneLocal, plateOnly } from "./format";
import { supabase } from "./supabase";

export const QUEUE_KEY = "dg_sync_queue";
export const AUTH_KEY = "dg_auth_profile";
const AUTORES_KEY = "dg_autores_caja";

export function rememberAutorMovimiento(id, nombre) {
  if (!id || !nombre || autorMovimiento(id)) return;
  try {
    const map = JSON.parse(localStorage.getItem(AUTORES_KEY) || "{}");
    map[id] = nombre;
    localStorage.setItem(AUTORES_KEY, JSON.stringify(map));
  } catch {
    // Si el navegador no guarda, el nombre sale de la ficha del usuario.
  }
}

export function autorMovimiento(id) {
  try {
    const map = JSON.parse(localStorage.getItem(AUTORES_KEY) || "{}");
    return map[id] || "";
  } catch {
    return "";
  }
}

const CACHE = {
  clientes: "dg_cache_clientes",
  vehiculos: "dg_cache_vehiculos",
  gestiones: "dg_cache_gestiones",
  movimientos_caja: "dg_cache_caja",
  gestion_documentos: "dg_cache_gestion_documentos",
  caja_comprobantes: "dg_cache_caja_comprobantes",
  membresias: "dg_cache_membresias",
  detailing_packs: "dg_cache_detailing_packs",
  detailing_pack_items: "dg_cache_detailing_pack_items",
  detailing_extras: "dg_cache_detailing_extras",
  cliente_imagenes: "dg_cache_cliente_imagenes",
  perfiles: "dg_cache_perfiles",
};

const ORDER = ["clientes", "vehiculos", "gestiones", "gestion_documentos", "movimientos_caja", "caja_comprobantes", "membresias", "detailing_packs", "detailing_pack_items", "detailing_extras", "cliente_imagenes"];
const TABLES = ["clientes", "vehiculos", "gestiones", "gestion_documentos", "movimientos_caja", "caja_comprobantes", "membresias", "detailing_packs", "detailing_pack_items", "detailing_extras", "cliente_imagenes", "perfiles"];

const COLUMNS = {
  clientes: ["id", "nombre", "telefono", "email", "dni_cuit", "vehiculo_actual", "patente", "categoria", "membresia", "lavados_usados", "lavados_totales", "ultimo_servicio", "notas", "foto_url", "creado_por", "actualizado_en", "creado_en"],
  vehiculos: ["id", "marca", "modelo", "anio", "patente", "kilometraje", "motor", "transmision", "modalidad", "estado", "moneda", "precio_compra", "precio_venta", "gastos_preparacion", "cliente_duenio_id", "cliente_comprador_id", "duenio_nombre", "duenio_telefono", "checklist", "notas", "imagen_url", "creado_por", "actualizado_en", "creado_en"],
  gestiones: ["id", "sector", "titulo", "cliente_id", "vehiculo_id", "cliente_nombre", "cliente_telefono", "vehiculo_datos", "etapa", "moneda", "costo_interno", "precio_cobrado", "pagado", "checklist", "notas", "fecha_ingreso", "creado_por", "actualizado_en", "creado_en"],
  movimientos_caja: ["id", "fecha", "tipo", "categoria", "concepto", "moneda", "monto", "metodo_pago", "vehiculo_id", "gestion_id", "cliente_id", "registrado_por", "actualizado_en", "creado_en"],
  gestion_documentos: ["id", "gestion_id", "tipo_documento", "estado_documento", "url_archivo", "nombre_archivo", "observaciones", "subido_por", "actualizado_en", "creado_en"],
  caja_comprobantes: ["id", "movimiento_id", "tipo_comprobante", "nro_comprobante", "url_archivo", "nombre_archivo", "subido_por", "creado_en"],
  membresias: ["id", "nombre", "duracion", "lavados_totales", "detalle_packs", "moneda", "precio", "creado_en", "actualizado_en"],
  detailing_packs: ["id", "nombre", "subtitulo", "moneda", "precio", "orden", "creado_en", "actualizado_en"],
  detailing_pack_items: ["id", "pack_id", "descripcion_item", "orden"],
  detailing_extras: ["id", "nombre", "descripcion", "moneda", "precio", "creado_en", "actualizado_en"],
  cliente_imagenes: ["id", "cliente_id", "tipo_imagen", "url_imagen", "subido_por", "creado_en"],
};

const INTS = {
  clientes: ["lavados_usados", "lavados_totales"],
  vehiculos: ["anio", "kilometraje"],
  gestiones: [],
  movimientos_caja: [],
  gestion_documentos: [],
  caja_comprobantes: [],
  membresias: ["lavados_totales"],
  detailing_packs: ["orden"],
  detailing_pack_items: ["orden"],
  detailing_extras: [],
  cliente_imagenes: [],
};

const NUMBERS = {
  clientes: [],
  vehiculos: ["precio_compra", "precio_venta", "gastos_preparacion"],
  gestiones: ["costo_interno", "precio_cobrado"],
  movimientos_caja: ["monto"],
  gestion_documentos: [],
  caja_comprobantes: [],
  membresias: ["precio"],
  detailing_packs: ["precio"],
  detailing_pack_items: [],
  detailing_extras: ["precio"],
  cliente_imagenes: [],
};

const NULLABLE = new Set([
  "ultimo_servicio",
  "creado_por",
  "cliente_duenio_id",
  "cliente_comprador_id",
  "cliente_id",
  "vehiculo_id",
  "fecha_ingreso",
  "gestion_id",
  "registrado_por",
  "anio",
  "imagen_url",
  "foto_url",
  "nro_comprobante",
  "subtitulo",
  "movimiento_id",
  "url_archivo",
  "nombre_archivo",
  "observaciones",
  "subido_por",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEMO_IDS = new Set([
  "c1111111-1111-4111-8111-111111111101",
  "c1111111-1111-4111-8111-111111111102",
  "c1111111-1111-4111-8111-111111111103",
  "c1111111-1111-4111-8111-111111111104",
  "v2222222-2222-4222-8222-222222222201",
  "v2222222-2222-4222-8222-222222222202",
  "v2222222-2222-4222-8222-222222222203",
  "v2222222-2222-4222-8222-222222222204",
  "g3333333-3333-4333-8333-333333333301",
  "g3333333-3333-4333-8333-333333333302",
  "g3333333-3333-4333-8333-333333333303",
  "g3333333-3333-4333-8333-333333333304",
  "m4444444-4444-4444-8444-444444444401",
  "m4444444-4444-4444-8444-444444444402",
  "m4444444-4444-4444-8444-444444444403",
  "m4444444-4444-4444-8444-444444444404",
  "m4444444-4444-4444-8444-444444444405",
  "m4444444-4444-4444-8444-444444444406",
  "m4444444-4444-4444-8444-444444444407",
  "m4444444-4444-4444-8444-444444444408",
]);

let flushing = false;

function isKeepableId(id) {
  return UUID_RE.test(String(id || "")) && !DEMO_IDS.has(id);
}

export function withoutResidue(rows) {
  return (rows || []).filter((row) => isKeepableId(row.id));
}

export function discardDemoResidue() {
  storage().removeItem("dg_demo_status");
  for (const table of Object.keys(CACHE)) {
    saveTable(table, loadTable(table).filter((row) => isKeepableId(row.id)));
  }
  saveQueue(loadQueue().filter((op) => isKeepableId(op.payload?.id)));
}

export async function deleteDemoClients() {
  if (!supabase) return;
  const ids = [...DEMO_IDS].filter((id) => UUID_RE.test(id));
  if (!ids.length) return;
  await supabase.from("clientes").delete().in("id", ids);
}

function storage() {
  return localStorage;
}

export function loadTable(table) {
  try {
    const parsed = JSON.parse(storage().getItem(CACHE[table]) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTable(table, rows) {
  storage().setItem(CACHE[table], JSON.stringify(rows));
}

export function loadQueue() {
  try {
    const parsed = JSON.parse(storage().getItem(QUEUE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQueue(queue) {
  storage().setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function loadProfile() {
  try {
    return JSON.parse(storage().getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  if (!profile) storage().removeItem(AUTH_KEY);
  else storage().setItem(AUTH_KEY, JSON.stringify(profile));
}

function emptyToNull(value) {
  if (value === "" || value === undefined) return null;
  return value;
}

function asNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function prepare(table, row) {
  const payload = {};
  for (const key of COLUMNS[table]) {
    let value = row[key];
    if (key === "fecha" || key === "fecha_ingreso" || key === "ultimo_servicio") {
      value = value ? String(value).slice(0, 10) : null;
    } else if (key === "anio") value = value === "" || value === null || value === undefined ? null : Math.round(asNumber(value));
    else if (key === "dni_cuit") value = dniCuit(value);
    else if (key === "telefono" || key === "cliente_telefono" || key === "duenio_telefono") value = phoneLocal(value);
    else if (key === "patente") value = plateOnly(value);
    else if (INTS[table].includes(key)) value = Math.round(asNumber(value));
    else if (NUMBERS[table].includes(key)) value = asNumber(value);
    else if (NULLABLE.has(key)) value = emptyToNull(value);
    else if (typeof value === "string") value = value.trim();
    payload[key] = value;
  }
  if (table === "vehiculos") {
    payload.checklist = { ...CHECKLIST_VEHICULO, ...(row.checklist || {}) };
    payload.modalidad = modalidadCanonica(row.modalidad);
  }
  if (table === "gestiones") {
    const previos = row.checklist || {};
    const resto = { ...previos };
    for (const key of ["form_08", "cedula", "titulo", "policial", "libre_deuda", "ceta", "tramites"]) delete resto[key];
    payload.checklist = { ...resto, tramites: tramitesDe(previos), policial_opcional: true };
    payload.pagado = Boolean(row.pagado);
  }
  if (COLUMNS[table].includes("actualizado_en") && !payload.actualizado_en) payload.actualizado_en = new Date().toISOString();
  if (COLUMNS[table].includes("creado_en") && !payload.creado_en) payload.creado_en = payload.actualizado_en || new Date().toISOString();
  return payload;
}

export function enqueue(op) {
  const queue = loadQueue().filter((item) => !(item.table === op.table && item.payload?.id === op.payload?.id));
  queue.push(op);
  saveQueue(queue);
  return queue;
}

export function sortQueue(queue) {
  return [...queue].sort((a, b) => {
    const aDelete = a.action === "DELETE" ? 1 : 0;
    const bDelete = b.action === "DELETE" ? 1 : 0;
    if (aDelete !== bDelete) return aDelete - bDelete;
    const direction = aDelete ? -1 : 1;
    const order = (ORDER.indexOf(a.table) - ORDER.indexOf(b.table)) * direction;
    if (order !== 0) return order;
    return a.timestamp - b.timestamp;
  });
}

function isNetworkError(error) {
  const message = String(error?.message || error || "");
  return typeof navigator !== "undefined" && (!navigator.onLine || /failed to fetch|networkerror|load failed|offline|timeout/i.test(message));
}

export async function pushOp(op) {
  if (!supabase) throw new Error("Supabase no está configurado");
  if (op.action === "DELETE") {
    const { error } = await supabase.from(op.table).delete().eq("id", op.payload.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(op.table).upsert(prepare(op.table, op.payload));
  if (error) throw error;
}

export async function flushQueue() {
  if (flushing) return { pending: loadQueue().length, error: null };
  if (!supabase || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return { pending: loadQueue().length, error: null };
  }
  flushing = true;
  let error = null;
  try {
    let queue = sortQueue(loadQueue());
    const tried = new Set();
    while (queue.length && navigator.onLine) {
      const op = queue[0];
      if (!isKeepableId(op.payload?.id)) {
        queue = queue.slice(1);
        saveQueue(queue);
        continue;
      }
      if (tried.has(op.id)) break;
      tried.add(op.id);
      try {
        await pushOp(op);
        queue = queue.slice(1);
        saveQueue(queue);
      } catch (caught) {
        error = caught;
        if (isNetworkError(caught)) break;
        queue = [...queue.slice(1), op];
        saveQueue(queue);
      }
    }
  } finally {
    flushing = false;
  }
  return { pending: loadQueue().length, error };
}

export async function pullAll() {
  if (!supabase) return { rows: {}, error: null };
  const rows = {};
  let error = null;
  for (const table of TABLES) {
    const { data, error: tableError } = await supabase.from(table).select("*");
    if (tableError) {
      error = tableError;
      continue;
    }
    rows[table] = data || [];
  }
  return { rows, error };
}

export function mergeRows(serverRows, queue, table) {
  const ops = queue.filter((op) => op.table === table);
  const deleted = new Set(ops.filter((op) => op.action === "DELETE").map((op) => op.payload.id));
  const upserts = new Map(ops.filter((op) => op.action === "UPSERT").map((op) => [op.payload.id, op.payload]));
  const map = new Map();
  for (const row of serverRows || []) {
    if (!deleted.has(row.id)) map.set(row.id, row);
  }
  for (const [id, row] of upserts) map.set(id, row);
  return [...map.values()].sort((a, b) => String(b.creado_en || "").localeCompare(String(a.creado_en || "")));
}

export function applyLocal(table, action, payload) {
  const current = loadTable(table);
  const next = action === "DELETE"
    ? current.filter((row) => row.id !== payload.id)
    : current.some((row) => row.id === payload.id)
      ? current.map((row) => (row.id === payload.id ? payload : row))
      : [payload, ...current];
  saveTable(table, next);
  return next;
}
