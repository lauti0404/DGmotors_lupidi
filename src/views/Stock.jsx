import { useEffect, useMemo, useState } from "react";
import { ClienteEditor } from "../components/ClienteEditor";
import { ClienteSearchSelect } from "../components/ClienteSearchSelect";
import { ConfirmacionCaja } from "../components/ConfirmacionCaja";
import { VehiculoEditor } from "../components/VehiculoEditor";
import { Empty, Field, GhostButton, Modal, Pill, Plate, PrimaryButton, StatusBadge, inputClass } from "../components/ui";
import { useAuth } from "../context/Auth";
import { useData } from "../context/Data";
import { ESTADOS_VEHICULO, MODALIDADES, modalidadCanonica } from "../lib/constants";
import { formatKm, money, phoneError, phoneLocal, vehicleLabel } from "../lib/format";
import { vehiclePhoto } from "../lib/images";
import { blankCliente, blankMovimiento, blankVehiculo } from "../lib/records";

function consumeQuick(kind) {
  if (sessionStorage.getItem("dg_quick_create") === kind) {
    sessionStorage.removeItem("dg_quick_create");
    return true;
  }
  return false;
}

export function Stock() {
  const { user } = useAuth();
  const { vehiculos, clientes, movimientos_caja = [], save } = useData();
  const [estado, setEstado] = useState("Todos");
  const [modalidad, setModalidad] = useState("Todas");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(null);
  const [detail, setDetail] = useState(null);
  const [sale, setSale] = useState(null);
  const [cajaVenta, setCajaVenta] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [newCliente, setNewCliente] = useState(false);

  useEffect(() => {
    if (consumeQuick("vehiculo")) setEditor(blankVehiculo(user?.id));
  }, [user]);

  const visible = useMemo(() => vehiculos.filter((vehicle) => {
    const text = `${vehicle.marca} ${vehicle.modelo} ${vehicle.patente}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (estado !== "Todos" && vehicle.estado !== estado) return false;
    if (modalidad !== "Todas" && modalidadCanonica(vehicle.modalidad) !== modalidad) return false;
    return true;
  }), [vehiculos, query, estado, modalidad]);

  function vender(impacto) {
    const buyer = clientes.find((item) => item.id === sale.cliente_comprador_id);
    const buyerName = buyer?.nombre || sale.comprador_nombre || "";
    const telefono = phoneLocal(sale.comprador_telefono);
    const phone = !buyer && telefono ? `Tel: ${telefono}` : "";
    const extra = [buyerName && !buyer ? `Comprador: ${buyerName}` : "", phone, sale.nota].filter(Boolean).join(". ");
    save("vehiculos", {
      ...sale.vehicle,
      estado: "Vendido",
      cliente_comprador_id: sale.cliente_comprador_id || null,
      notas: [sale.vehicle.notas, extra].filter(Boolean).join("\n"),
    });
    const base = {
      vehiculo_id: sale.vehicle.id,
      cliente_id: sale.cliente_comprador_id || null,
    };
    if (impacto?.ingreso && Number(impacto.ingreso.monto) > 0) {
      save("movimientos_caja", blankMovimiento(user?.id, {
        ...base,
        tipo: "Ingreso",
        categoria: impacto.ingreso.categoria,
        concepto: impacto.ingreso.concepto,
        moneda: impacto.ingreso.moneda,
        monto: impacto.ingreso.monto,
        metodo_pago: impacto.ingreso.metodo,
      }));
    }
    if (impacto?.egreso && Number(impacto.egreso.monto) > 0) {
      save("movimientos_caja", blankMovimiento(user?.id, {
        ...base,
        tipo: "Egreso",
        categoria: impacto.egreso.categoria,
        concepto: impacto.egreso.concepto,
        moneda: impacto.egreso.moneda,
        monto: impacto.egreso.monto,
        metodo_pago: impacto.egreso.metodo,
      }));
    }
    setCajaVenta(false);
    setSale(null);
  }

  function continuarVenta(event) {
    event.preventDefault();
    const buyer = clientes.find((item) => item.id === sale.cliente_comprador_id);
    const telefono = phoneLocal(sale.comprador_telefono);
    const problem = !buyer && phoneError(telefono);
    if (problem) {
      setSaleError(problem);
      return;
    }
    setCajaVenta(true);
  }

  const detailImage = detail ? vehiclePhoto(detail) : "";
  const buyerLocked = Boolean(sale?.cliente_comprador_id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input className={`${inputClass} max-w-xs`} placeholder="Buscar marca, modelo o patente" value={query} onChange={(event) => setQuery(event.target.value)} />
        <PrimaryButton onClick={() => setEditor(blankVehiculo(user?.id))}>Publicar vehículo</PrimaryButton>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Todos", ...ESTADOS_VEHICULO].map((item) => <Pill key={item} active={estado === item} onClick={() => setEstado(item)}>{item}</Pill>)}
      </div>
      <div className="flex flex-wrap gap-2">
        {["Todas", ...MODALIDADES].map((item) => <Pill key={item} active={modalidad === item} onClick={() => setModalidad(item)}>{item}</Pill>)}
      </div>

      {visible.length === 0 ? <Empty>No hay vehículos con ese filtro.</Empty> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map((vehicle) => {
            const photo = vehiclePhoto(vehicle);
            return (
              <article key={vehicle.id} className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
                {photo && <img src={photo} alt="" className="aspect-[2/1] w-full object-cover" />}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl uppercase leading-none">{vehicle.marca} {vehicle.modelo}</h2>
                      <p className="text-sm text-[#A1A1AA] mt-1">{vehicle.anio} · {formatKm(vehicle.kilometraje)}</p>
                    </div>
                    <StatusBadge status={vehicle.estado} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
                    <Plate>{vehicle.patente}</Plate>
                    <span>{modalidadCanonica(vehicle.modalidad)}</span>
                  </div>
                  <div className="font-display text-2xl">{money(vehicle.precio_venta, vehicle.moneda)}</div>
                  <div className="flex flex-wrap gap-2">
                    <GhostButton onClick={() => setDetail(vehicle)}>Ver datos</GhostButton>
                    <GhostButton onClick={() => setEditor(vehicle)}>Editar</GhostButton>
                    {vehicle.estado !== "Vendido" && (
                      <PrimaryButton onClick={() => { setSaleError(""); setSale({
                        vehicle,
                        registrar: true,
                        monto: vehicle.precio_venta || 0,
                        moneda: vehicle.moneda || "USD",
                        metodo: vehicle.moneda === "USD" ? "USD Billete" : "Transferencia",
                        cliente_comprador_id: vehicle.cliente_comprador_id || "",
                        comprador_nombre: "",
                        nota: "",
                      }); }}>Marcar como vendido</PrimaryButton>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editor && <VehiculoEditor initial={editor} onClose={() => setEditor(null)} />}

      {detail && (
        <Modal title={`${detail.marca} ${detail.modelo}`} subtitle={detail.patente || detail.modalidad} onClose={() => setDetail(null)}>
          <div className="p-5 space-y-4">
            {detailImage && <img src={detailImage} alt="" className="aspect-[2/1] w-full rounded-xl object-cover" />}
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                ["Año", detail.anio],
                ["Kilometraje", formatKm(detail.kilometraje)],
                ["Motor", detail.motor || "Sin cargar"],
                ["Transmisión", detail.transmision || "Sin cargar"],
                ["Modalidad", modalidadCanonica(detail.modalidad)],
                ["Estado", detail.estado],
                ["Compra", detail.precio_compra ? money(detail.precio_compra, detail.moneda) : "Sin cargar"],
                ["Venta", money(detail.precio_venta, detail.moneda)],
                ["Preparación", detail.gastos_preparacion ? money(detail.gastos_preparacion, detail.moneda) : "Sin cargar"],
                ["Dueño", detail.duenio_nombre || "Sin cargar"],
                ["Teléfono", detail.duenio_telefono || "Sin cargar"],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-white/10 pb-2">
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-[#A1A1AA] underline underline-offset-4">{label}:</dt>
                  <dd className="mt-1">{value}</dd>
                </div>
              ))}
            </dl>
            {detail.notas && <p className="text-sm">{detail.notas}</p>}
            <GhostButton onClick={() => { setEditor(detail); setDetail(null); }}>Editar</GhostButton>
          </div>
        </Modal>
      )}

      {sale && (
        <Modal title="Marcar como vendido" subtitle={vehicleLabel(sale.vehicle)} onClose={() => { setSale(null); setCajaVenta(false); }}>
          <form onSubmit={continuarVenta} className="p-5 space-y-4">
            <div>
              <span className="block text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA] underline decoration-white/30 underline-offset-4">Comprador:</span>
              <div className="mt-1.5">
                <ClienteSearchSelect
                  clientes={clientes}
                  vehiculos={vehiculos}
                  value={sale.cliente_comprador_id || ""}
                  onChange={(id) => {
                    const cliente = clientes.find((item) => item.id === id);
                    setSale({ ...sale, cliente_comprador_id: id, comprador_nombre: cliente?.nombre || "", comprador_telefono: cliente?.telefono || "" });
                  }}
                />
              </div>
            </div>
            <GhostButton onClick={() => setNewCliente(true)}>Agregar nueva ficha de cliente</GhostButton>
            <Field label="Nombre del comprador" hint={buyerLocked ? "Sale de la ficha elegida." : "Solo si todavía no tiene ficha."}>
              <input className={inputClass} value={sale.comprador_nombre || ""} disabled={buyerLocked} onChange={(event) => setSale({ ...sale, comprador_nombre: event.target.value })} />
            </Field>
            <Field label="Teléfono del comprador" hint="Ej: 1150649934. Sin +54. Queda en la nota si no hay ficha.">
              <input className={inputClass} inputMode="numeric" maxLength={10} placeholder="1150649934" value={sale.comprador_telefono || ""} disabled={buyerLocked} onChange={(event) => { setSaleError(""); setSale({ ...sale, comprador_telefono: phoneLocal(event.target.value) }); }} />
            </Field>
            <Field label="Nota" hint="Cualquier aclaración de la operación.">
              <textarea className={`${inputClass} min-h-20`} value={sale.nota || ""} onChange={(event) => setSale({ ...sale, nota: event.target.value })} />
            </Field>
            <p className="text-xs text-[#A1A1AA]">El siguiente paso muestra el precio de venta, la compra y los gastos, y deja elegir si entran en caja.</p>
            {saleError && <p className="text-sm text-red-300">{saleError}</p>}
            <PrimaryButton type="submit">Continuar a caja</PrimaryButton>
          </form>
        </Modal>
      )}

      {sale && cajaVenta && (
        <ConfirmacionCaja
          titulo="Venta de vehículo"
          subtitulo={vehicleLabel(sale.vehicle)}
          aviso={movimientos_caja.some((row) => row.vehiculo_id === sale.vehicle.id) ? "Esta unidad ya tiene movimientos en caja. Confirmar agrega otros." : ""}
          textoOmitir="Guardar la venta sin impactar en caja"
          ingreso={{
            activo: Number(sale.vehicle.precio_venta) > 0,
            monto: Number(sale.vehicle.precio_venta) || 0,
            concepto: `Venta ${vehicleLabel(sale.vehicle)}`,
            categoria: "Venta de Vehículo",
            moneda: sale.vehicle.moneda || "USD",
            metodo: sale.vehicle.moneda === "USD" ? "USD Billete" : "Transferencia",
          }}
          egreso={{
            activo: (Number(sale.vehicle.precio_compra) || 0) + (Number(sale.vehicle.gastos_preparacion) || 0) > 0,
            monto: (Number(sale.vehicle.precio_compra) || 0) + (Number(sale.vehicle.gastos_preparacion) || 0),
            concepto: `Compra y preparación ${vehicleLabel(sale.vehicle)}`,
            categoria: Number(sale.vehicle.precio_compra) > 0 ? "Compra / Toma de Vehículo" : "Gastos de Preparación de Unidad",
            moneda: sale.vehicle.moneda || "USD",
            metodo: sale.vehicle.moneda === "USD" ? "USD Billete" : "Transferencia",
          }}
          onClose={() => setCajaVenta(false)}
          onOmitir={() => vender(null)}
          onConfirm={(impacto) => vender(impacto)}
        />
      )}

      {newCliente && sale && (
        <ClienteEditor
          initial={blankCliente(user?.id)}
          onClose={() => setNewCliente(false)}
          onSaved={(cliente) => {
            setSale((current) => current && ({ ...current, cliente_comprador_id: cliente.id, comprador_nombre: cliente.nombre, comprador_telefono: cliente.telefono || "" }));
            setNewCliente(false);
          }}
        />
      )}
    </div>
  );
}
