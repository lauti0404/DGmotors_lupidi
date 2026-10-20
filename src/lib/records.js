import { CHECKLIST_GESTION, CHECKLIST_VEHICULO } from "./constants";
import { todayISO } from "./format";

function now() {
  return new Date().toISOString();
}

export function blankCliente(userId) {
  const stamp = now();
  return {
    id: crypto.randomUUID(),
    nombre: "",
    telefono: "",
    email: "",
    dni_cuit: "",
    vehiculo_actual: "",
    patente: "",
    categoria: "Cliente Detailing",
    membresia: "Ninguna",
    lavados_usados: 0,
    lavados_totales: 0,
    ultimo_servicio: null,
    notas: "",
    creado_por: userId || null,
    actualizado_en: stamp,
    creado_en: stamp,
  };
}

export function blankVehiculo(userId) {
  const stamp = now();
  return {
    id: crypto.randomUUID(),
    marca: "",
    modelo: "",
    anio: new Date().getFullYear(),
    patente: "",
    kilometraje: 0,
    motor: "",
    transmision: "",
    modalidad: "Consigna Digital",
    estado: "Disponible",
    moneda: "USD",
    precio_compra: 0,
    precio_venta: 0,
    gastos_preparacion: 0,
    cliente_duenio_id: null,
    cliente_comprador_id: null,
    duenio_nombre: "",
    duenio_telefono: "",
    checklist: { ...CHECKLIST_VEHICULO },
    notas: "",
    creado_por: userId || null,
    actualizado_en: stamp,
    creado_en: stamp,
  };
}

export function blankGestion(userId, sector = "Gestoria") {
  const stamp = now();
  return {
    id: crypto.randomUUID(),
    sector,
    titulo: "",
    cliente_id: null,
    vehiculo_id: null,
    cliente_nombre: "",
    cliente_telefono: "",
    vehiculo_datos: "",
    etapa: sector === "Detailing" ? "En Espera" : "Documentación",
    moneda: "ARS",
    costo_interno: 0,
    precio_cobrado: 0,
    pagado: false,
    checklist: { ...CHECKLIST_GESTION },
    notas: "",
    fecha_ingreso: todayISO(),
    creado_por: userId || null,
    actualizado_en: stamp,
    creado_en: stamp,
  };
}

export function blankMovimiento(userId, extra = {}) {
  const stamp = now();
  return {
    id: crypto.randomUUID(),
    fecha: todayISO(),
    tipo: "Ingreso",
    categoria: "Venta de Vehículo",
    concepto: "",
    moneda: "ARS",
    monto: 0,
    metodo_pago: "Efectivo",
    vehiculo_id: null,
    gestion_id: null,
    cliente_id: null,
    registrado_por: userId || null,
    actualizado_en: stamp,
    creado_en: stamp,
    ...extra,
  };
}
