export const CATEGORIAS_CLIENTE = ["Comprador", "Vendedor Consigna", "Cliente Detailing", "Socio Membresía"];
export const MEMBRESIAS = ["Ninguna", "Stone", "Bronze", "Silver", "Gold", "Diamond"];
export const LAVADOS_SUGERIDOS = { Ninguna: 0, Stone: 2, Bronze: 3, Silver: 6, Gold: 9, Diamond: 12 };

export const MODALIDADES = ["Consigna Digital", "Wash & Sell"];
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

export function rubroDe(categoria) {
  return RUBROS.find((rubro) => rubro.categories.includes(categoria)) || null;
}

export const CHECKLIST_VEHICULO = { detailing: false, fotos: false, publicado: false };
export const CHECKLIST_GESTION = {
  form_08: false,
  cedula: false,
  titulo: false,
  policial: false,
  libre_deuda: false,
  ceta: false,
};

export const CHECKLIST_GESTION_LABELS = [
  ["form_08", "08"],
  ["cedula", "Cédula"],
  ["titulo", "Título"],
  ["policial", "Policial"],
  ["libre_deuda", "Libre deuda"],
  ["ceta", "CETA"],
];
