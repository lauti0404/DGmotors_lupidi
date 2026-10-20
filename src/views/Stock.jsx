import { useEffect, useMemo, useState } from "react";
import { ClienteEditor } from "../components/ClienteEditor";
import { VehiculoEditor } from "../components/VehiculoEditor";
import { Empty, Field, GhostButton, Modal, Pill, Plate, PrimaryButton, StatusBadge, inputClass } from "../components/ui";
import { useAuth } from "../context/Auth";
import { useData } from "../context/Data";
import { ESTADOS_VEHICULO, MODALIDADES } from "../lib/constants";
import { formatKm, money, phoneLocal, vehicleLabel } from "../lib/format";
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
  const { vehiculos, clientes, save } = useData();
  const [estado, setEstado] = useState("Todos");
  const [modalidad, setModalidad] = useState("Todas");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(null);
  const [detail, setDetail] = useState(null);
  const [sale, setSale] = useState(null);
  const [newCliente, setNewCliente] = useState(false);

  useEffect(() => {
    if (consumeQuick("vehiculo")) setEditor(blankVehiculo(user?.id));
  }, [user]);

  const visible = useMemo(() => vehiculos.filter((vehicle) => {
    const text = `${vehicle.marca} ${vehicle.modelo} ${vehicle.patente}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (estado !== "Todos" && vehicle.estado !== estado) return false;
    if (modalidad !== "Todas" && vehicle.modalidad !== modalidad) return false;
    return true;
  }), [vehiculos, query, estado, modalidad]);

  function confirmSale(event) {
    event.preventDefault();
    const buyer = clientes.find((item) => item.id === sale.cliente_comprador_id);
    const buyerName = buyer?.nombre || sale.comprador_nombre || "";
    const phone = !buyer && sale.comprador_telefono ? `Tel: ${sale.comprador_telefono}` : "";
    const extra = [buyerName && !buyer ? `Comprador: ${buyerName}` : "", phone, sale.nota].filter(Boolean).join(". ");
    save("vehiculos", {
      ...sale.vehicle,
      estado: "Vendido",
      cliente_comprador_id: sale.cliente_comprador_id || null,
      notas: [sale.vehicle.notas, extra].filter(Boolean).join("\n"),
    });
    if (sale.registrar && Number(sale.monto) > 0) {
      const concepto = [`Venta ${vehicleLabel(sale.vehicle)}`, buyerName ? `Comprador: ${buyerName}` : "", phone, sale.nota].filter(Boolean).join(". ");
      save("movimientos_caja", blankMovimiento(user?.id, {
        tipo: "Ingreso",
        categoria: "Autos - Venta / Comisión",
        concepto,
        moneda: sale.moneda,
        monto: sale.monto,
        metodo_pago: sale.metodo,
        vehiculo_id: sale.vehicle.id,
        cliente_id: sale.cliente_comprador_id || null,
      }));
    }
    setSale(null);
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
                    <span>{vehicle.modalidad}</span>
                  </div>
                  <div className="font-display text-2xl">{money(vehicle.precio_venta, vehicle.moneda)}</div>
                  <div className="flex flex-wrap gap-2">
                    <GhostButton onClick={() => setDetail(vehicle)}>Ver datos</GhostButton>
                    <GhostButton onClick={() => setEditor(vehicle)}>Editar</GhostButton>
                    {vehicle.estado !== "Vendido" && (
                      <PrimaryButton onClick={() => setSale({
                        vehicle,
                        registrar: true,
                        monto: vehicle.precio_venta || 0,
                        moneda: vehicle.moneda || "USD",
                        metodo: vehicle.moneda === "USD" ? "USD Billete" : "Transferencia",
                        cliente_comprador_id: vehicle.cliente_comprador_id || "",
                        comprador_nombre: "",
                        nota: "",
                      })}>Marcar como vendido</PrimaryButton>
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
                ["Modalidad", detail.modalidad],
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
        <Modal title="Marcar como vendido" subtitle={vehicleLabel(sale.vehicle)} onClose={() => setSale(null)}>
          <form onSubmit={confirmSale} className="p-5 space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sale.registrar} onChange={(event) => setSale({ ...sale, registrar: event.target.checked })} />
              Registrar el ingreso en caja
            </label>
            <Field label="Comprador">
              <select className={inputClass} value={sale.cliente_comprador_id || ""} onChange={(event) => {
                const cliente = clientes.find((item) => item.id === event.target.value);
                setSale({ ...sale, cliente_comprador_id: event.target.value, comprador_nombre: cliente?.nombre || "" });
              }}>
                <option value="">Sin ficha, escribir a mano</option>
                {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
              </select>
            </Field>
            <GhostButton onClick={() => setNewCliente(true)}>Agregar nueva ficha de cliente</GhostButton>
            <Field label="Nombre del comprador" hint={buyerLocked ? "Sale de la ficha elegida." : "Solo si todavía no tiene ficha."}>
              <input className={inputClass} value={sale.comprador_nombre || ""} disabled={buyerLocked} onChange={(event) => setSale({ ...sale, comprador_nombre: event.target.value })} />
            </Field>
            <Field label="Teléfono del comprador" hint="Ej: 1150649934. Sin +54. Queda en la nota si no hay ficha.">
              <input className={inputClass} inputMode="numeric" placeholder="1150649934" value={sale.comprador_telefono || ""} disabled={buyerLocked} onChange={(event) => setSale({ ...sale, comprador_telefono: phoneLocal(event.target.value) })} />
            </Field>
            <Field label="Nota" hint="Cualquier aclaración de la operación.">
              <textarea className={`${inputClass} min-h-20`} value={sale.nota || ""} onChange={(event) => setSale({ ...sale, nota: event.target.value })} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Monto"><input className={inputClass} type="number" value={sale.monto} onChange={(event) => setSale({ ...sale, monto: event.target.value })} /></Field>
              <Field label="Moneda">
                <select className={inputClass} value={sale.moneda} onChange={(event) => setSale({ ...sale, moneda: event.target.value })}>
                  <option>ARS</option><option>USD</option>
                </select>
              </Field>
              <Field label="Método">
                <select className={inputClass} value={sale.metodo} onChange={(event) => setSale({ ...sale, metodo: event.target.value })}>
                  {["Efectivo", "Transferencia", "USD Billete", "Cripto/Otro"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
            </div>
            <p className="text-xs text-[#A1A1AA]">El ingreso queda en Autos - Venta / Comisión, con el comprador y la nota en la descripción.</p>
            <PrimaryButton type="submit">Confirmar venta</PrimaryButton>
          </form>
        </Modal>
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
