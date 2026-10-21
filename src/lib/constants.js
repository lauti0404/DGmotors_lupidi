export const CATEGORIAS_CLIENTE = ["Comprador", "Vendedor Consigna", "Cliente Detailing", "Socio Membresía"];
export const MEMBRESIAS = ["Ninguna", "Stone", "Bronze", "Silver", "Gold", "Diamond"];
export const LAVADOS_SUGERIDOS = { Ninguna: 0, Stone: 2, Bronze: 3, Silver: 6, Gold: 9, Diamond: 12 };

export const MODALIDADES = ["Stock Propio", "Consigna"];

export function modalidadCanonica(value) {
  if (value === "Consigna" || value === "Consigna Digital") return "Consigna";
  return "Stock Propio";
}
export const ESTADOS_VEHICULO = ["Disponible", "Reservado", "Vendido"];
export const MONEDAS = ["ARS", "USD"];
export const METODOS_PAGO = ["Efectivo", "Transferencia", "USD Billete", "Cripto/Otro"];
export const TIPOS_CAJA = ["Ingreso", "Egreso"];
export const TIPOS_COMPROBANTE = ["Factura A", "Factura B / C", "Ticket / Recibo", "Comprobante Transferencia", "Otro"];
export const TIPOS_IMAGEN_CLIENTE = ["DNI Frente", "DNI Dorso", "Licencia Conducir", "Otro"];

export const TIPOS_DOCUMENTO = [
  "Titulo Automotor",
  "Formulario 08",
  "Cedula Verde/Azul",
  "Verificacion Policial",
  "Informe de Dominio",
  "Libre Deuda Patentes",
  "Libre Deuda Infracciones",
  "CETA",
  "DNI / Constancia CUIT",
  "Otro",
];

export const ESTADOS_DOCUMENTO = [
  "Pendiente",
  "Recibido",
  "Verificado / Aprobado",
  "Observado / Rechazado",
];

export const ETAPAS_GESTORIA = [
  "Documentación",
  "Verificación Policial",
  "Informe Dominio/Multas",
  "Turno DNRPA",
  "Finalizado",
];

export const ETAPAS_DETAILING = ["En Espera", "Lavado/Descontaminado", "Pulido/Cerámico", "Listo"];

export const PACKS = [
  { name: "Basic Pack", price: 95000, items: ["Limpieza de llantas", "Carrocería a detalle", "Encerado", "Aspirado interior", "Tablero y consola"] },
  { name: "Exclusive Pack", price: 165000, items: ["Todo lo del Basic Pack", "Paneles de puerta", "Tapizados o cuero", "Plásticos interiores"] },
  { name: "Master Pack", price: 260000, items: ["Aspirado profundo", "Plásticos", "Llantas", "Descontaminado", "Pulido y sellado"] },
  { name: "Ultra Pack", price: 540000, items: ["Todo lo del Master Pack", "Cerámico de 1 a 3 años", "Repelencia al agua", "Protección de micro rayas"] },
];

export const RUBROS = [
  {
    id: "autos",
    label: "Autos",
    emoji: "🚗",
    categories: [
      "Venta de Vehículo",
      "Comisión Consigna",
      "Comisión Consigna Digital",
      "Servicio Wash & Sell",
      "Compra / Toma de Vehículo",
      "Gastos de Preparación de Unidad",
      "Autos - Venta / Comisión",
    ],
  },
  {
    id: "detailing",
    label: "Detailing",
    emoji: "✨",
    categories: [
      "Servicio Detailing (Packs)",
      "Suscripción DG Membership",
      "Insumos y Químicos de Detailing",
      "Herramientas / Maquinaria",
      "Detailing",
    ],
  },
  {
    id: "gestoria",
    label: "Gestoría",
    emoji: "📋",
    categories: ["Cobro de Trámite / Transferencia", "Pago de Aranceles DNRPA / Informes / Sellados", "Honorarios Gestor", "Gestoría"],
  },
  {
    id: "productos",
    label: "Productos Varios",
    emoji: "🛍️",
    categories: ["Venta de Productos / Merch / Accesorios", "Compra de Stock de Productos Varios"],
  },
  {
    id: "operativos",
    label: "Gastos Operativos",
    emoji: "🏢",
    categories: ["Alquiler / Servicios / Internet", "Sueldos / Comisiones Equipo", "Publicidad / Marketing", "Gastos Varios de Oficina"],
  },
];

export const CATEGORIAS_LEGACY = new Set(["Servicio Wash & Sell", "Comisión Consigna Digital"]);

export function categoriaVisible(value) {
  if (value === "Servicio Wash & Sell") return "Stock Propio";
  if (value === "Comisión Consigna Digital") return "Comisión Consigna";
  return value;
}

export function categoriasElegibles() {
  return RUBROS.map((group) => ({
    ...group,
    categories: group.categories.filter((item) => !CATEGORIAS_LEGACY.has(item)),
  }));
}

export function rubroDe(categoria) {
  return RUBROS.find((rubro) => rubro.categories.includes(categoria)) || null;
}

export const CHECKLIST_VEHICULO = { detailing: false, fotos: false, publicado: false };

export const TRAMITES_GESTORIA = [
  { key: "policial", label: "Policial" },
  { key: "transferencia", label: "Transferencia" },
  { key: "informe_dominio", label: "Informe de dominio e histórico" },
  { key: "informe_suats", label: "Informe SUATS" },
  { key: "reduccion_infracciones", label: "Reducción de infracciones" },
  { key: "cambio_motor", label: "Cambio de motor" },
  { key: "cambio_radicacion", label: "Cambio de radicación" },
  { key: "patentamiento", label: "Patentamiento" },
  { key: "escribania", label: "Escribanía" },
];

export function tramitesIniciales() {
  return Object.fromEntries(TRAMITES_GESTORIA.map((item) => [item.key, { activo: Boolean(item.requerido), obtenido: false }]));
}

export function checklistGestionInicial() {
  return { tramites: tramitesIniciales(), policial_opcional: true };
}

export function tramitesDe(checklist) {
  const base = tramitesIniciales();
  const stored = checklist?.tramites;
  if (stored && typeof stored === "object") {
    for (const item of TRAMITES_GESTORIA) {
      const row = stored[item.key] || {};
      const obtenido = Boolean(row.obtenido);
      base[item.key] = { activo: Boolean(row.activo) || obtenido, obtenido };
    }
    return base;
  }
  if (checklist && checklist.policial === true) base.policial = { activo: true, obtenido: true };
  return base;
}

export function resumenTramites(checklist) {
  const tramites = tramitesDe(checklist);
  const obtenidos = [];
  const pendientes = [];
  for (const item of TRAMITES_GESTORIA) {
    const row = tramites[item.key];
    if (!row?.activo) continue;
    if (row.obtenido) obtenidos.push(item);
    else pendientes.push(item);
  }
  return { tramites, obtenidos, pendientes };
}
