import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/Auth";
import { useData } from "../context/Data";
import { METODOS_PAGO, RUBROS, TIPOS_CAJA, TIPOS_COMPROBANTE } from "../lib/constants";
import { readDocumentFile } from "../lib/images";
import { balanceOf, formatDate, money, todayISO, vehicleLabel } from "../lib/format";
import { blankCliente, blankMovimiento, blankVehiculo } from "../lib/records";
import { ArchivoViewer } from "../components/ArchivoViewer";
import { ClienteEditor } from "../components/ClienteEditor";
import { ClienteFields, VehiculoFields } from "../components/PartyFields";
import { VehiculoEditor } from "../components/VehiculoEditor";
import { CutLabel, Empty, Field, GhostButton, Modal, Pill, PrimaryButton, inputClass } from "../components/ui";

export function Caja() {
  const { user } = useAuth();
  const { movimientos_caja, vehiculos, gestiones, clientes, caja_comprobantes = [], perfiles = [], save, remove } = useData();
  const [tab, setTab] = useState("movimientos");
  const [rubro, setRubro] = useState("todos");
  const [tipo, setTipo] = useState("Todos");
  const [moneda, setMoneda] = useState("Todas");
  const [metodo, setMetodo] = useState("Todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [editor, setEditor] = useState(null);
  const [comprobante, setComprobante] = useState({ tipo_comprobante: "Ticket / Recibo", nro_comprobante: "", url_archivo: "", nombre_archivo: "" });
  const [archivo, setArchivo] = useState(null);
  const [newCliente, setNewCliente] = useState(false);
  const [newVehiculo, setNewVehiculo] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("dg_quick_create") === "caja") {
      sessionStorage.removeItem("dg_quick_create");
      openMove(blankMovimiento(user?.id));
    }
  }, [user]);

  const scoped = useMemo(() => movimientos_caja.filter((row) => {
    const group = RUBROS.find((item) => item.id === rubro);
    if (group && !group.categories.includes(row.categoria)) return false;
    if (moneda !== "Todas" && row.moneda !== moneda) return false;
    if (metodo !== "Todos" && row.metodo_pago !== metodo) return false;
    const day = String(row.fecha || "").slice(0, 10);
    if (desde && day < desde) return false;
    if (hasta && day > hasta) return false;
    return true;
  }), [movimientos_caja, rubro, moneda, metodo, desde, hasta]);

  const filtered = useMemo(() => scoped.filter((row) => {
    if (tipo === "Solo Ingresos" && row.tipo !== "Ingreso") return false;
    if (tipo === "Solo Egresos" && row.tipo !== "Egreso") return false;
    return true;
  }), [scoped, tipo]);

  const scopeLabel = [
    rubro === "todos" ? "Todos los rubros" : RUBROS.find((item) => item.id === rubro)?.label,
    desde || hasta ? `${desde ? formatDate(desde) : "…"} – ${hasta ? formatDate(hasta) : "…"}` : "Todas las fechas",
    metodo !== "Todos" ? metodo : "",
    moneda !== "Todas" ? moneda : "",
  ].filter(Boolean).join(" · ");
  const totalCurrencies = moneda === "Todas" ? ["ARS", "USD"] : [moneda];
  const monthValue = desde.endsWith("-01") && hasta.slice(0, 7) === desde.slice(0, 7) ? desde.slice(0, 7) : "";

  function applyMonth(value) {
    if (!value) {
      setDesde("");
      setHasta("");
      return;
    }
    const [year, month] = value.split("-");
    const last = new Date(Number(year), Number(month), 0).getDate();
    setDesde(`${year}-${month}-01`);
    setHasta(`${year}-${month}-${String(last).padStart(2, "0")}`);
  }

  function submit(event) {
    event.preventDefault();
    const manual = [
      !editor.cliente_id && editor.cliente_manual ? `Cliente: ${editor.cliente_manual}${editor.cliente_telefono ? ` (${editor.cliente_telefono})` : ""}` : "",
      !editor.vehiculo_id && editor.vehiculo_manual ? `Vehículo: ${editor.vehiculo_manual}` : "",
    ].filter(Boolean);
    const concepto = [editor.concepto.trim(), ...manual].filter(Boolean).join(". ");
    if (!concepto || !editor.categoria) return;
    const saved = save("movimientos_caja", { ...editor, concepto, fecha: editor.fecha || todayISO() });
    if (comprobante.url_archivo) {
      const known = perfiles.some((item) => item.id === user?.id);
      save("caja_comprobantes", {
        id: comprobante.id || crypto.randomUUID(),
        movimiento_id: saved.id,
        tipo_comprobante: comprobante.tipo_comprobante || "Ticket / Recibo",
        nro_comprobante: comprobante.nro_comprobante || "",
        url_archivo: comprobante.url_archivo,
        nombre_archivo: comprobante.nombre_archivo || "",
        subido_por: known ? user.id : null,
        creado_en: comprobante.creado_en || new Date().toISOString(),
      });
    }
    setEditor(null);
  }

  function openMove(row) {
    setEditor(row);
    setComprobante(caja_comprobantes.find((item) => item.movimiento_id === row?.id) || { tipo_comprobante: "Ticket / Recibo", nro_comprobante: "", url_archivo: "", nombre_archivo: "" });
  }

  async function onComprobante(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const result = await readDocumentFile(file);
      setComprobante((current) => ({ ...current, url_archivo: result.dataUrl, nombre_archivo: result.name }));
    } catch (caught) {
      window.alert(caught.message);
    }
  }

  const vendidos = vehiculos.filter((vehicle) => vehicle.estado === "Vendido");

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {["ARS", "USD"].map((currency) => (
          <article key={currency} className="bg-[#141414] border border-white/10 rounded-2xl p-4">
            <CutLabel>Caja {currency}</CutLabel>
            <div className="mt-4 font-display text-3xl">{money(balanceOf(movimientos_caja, currency), currency)}</div>
          </article>
        ))}
      </div>

      <div className="flex gap-2">
        <Pill active={tab === "movimientos"} onClick={() => setTab("movimientos")}>Movimientos</Pill>
        <Pill active={tab === "rentabilidad"} onClick={() => setTab("rentabilidad")}>Rentabilidad por unidad</Pill>
      </div>

      {tab === "rentabilidad" ? (
        vendidos.length === 0 ? <Empty>Todavía no hay unidades vendidas.</Empty> : (
          <div className="overflow-x-auto border border-white/10 rounded-2xl">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-[0.14em] text-[#A1A1AA]">
                <tr>
                  <th className="px-3 py-3">Unidad</th>
                  <th className="px-3 py-3">Compra</th>
                  <th className="px-3 py-3">Preparación</th>
                  <th className="px-3 py-3">Venta</th>
                  <th className="px-3 py-3">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {vendidos.map((vehicle) => {
                  const costo = (Number(vehicle.precio_compra) || 0) + (Number(vehicle.gastos_preparacion) || 0);
                  const resultado = (Number(vehicle.precio_venta) || 0) - costo;
                  return (
                    <tr key={vehicle.id} className="border-t border-white/5">
                      <td className="px-3 py-3">{vehicleLabel(vehicle)}<div className="text-xs text-[#A1A1AA]">{vehicle.patente} · {vehicle.modalidad}</div></td>
                      <td className="px-3 py-3">{money(vehicle.precio_compra, vehicle.moneda)}</td>
                      <td className="px-3 py-3">{money(vehicle.gastos_preparacion, vehicle.moneda)}</td>
                      <td className="px-3 py-3">{money(vehicle.precio_venta, vehicle.moneda)}</td>
                      <td className={`px-3 py-3 ${resultado >= 0 ? "text-emerald-300" : "text-red-300"}`}>{money(resultado, vehicle.moneda)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Pill active={rubro === "todos"} onClick={() => setRubro("todos")}>Todos</Pill>
            {RUBROS.map((item) => <Pill key={item.id} active={rubro === item.id} onClick={() => setRubro(item.id)}>{item.label}</Pill>)}
          </div>
          <div className="flex flex-wrap gap-2">
            {["Todos", "Solo Ingresos", "Solo Egresos"].map((item) => <Pill key={item} active={tipo === item} onClick={() => setTipo(item)}>{item}</Pill>)}
            {["Todas", "ARS", "USD"].map((item) => <Pill key={item} active={moneda === item} onClick={() => setMoneda(item)}>{item === "Todas" ? "ARS y USD" : item}</Pill>)}
          </div>
          <div className="grid sm:grid-cols-4 gap-3">
            <Field label="Método de pago">
              <select className={inputClass} value={metodo} onChange={(event) => setMetodo(event.target.value)}>
                <option>Todos</option>
                {METODOS_PAGO.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Mes">
              <input className={inputClass} type="month" value={monthValue} onChange={(event) => applyMonth(event.target.value)} />
            </Field>
            <Field label="Desde"><input className={inputClass} type="date" value={desde} onChange={(event) => setDesde(event.target.value)} /></Field>
            <Field label="Hasta"><input className={inputClass} type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} /></Field>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {[
              ["Total ingresos", "Ingreso"],
              ["Total egresos", "Egreso"],
              ["Balance neto", "Balance"],
            ].map(([label, kind]) => (
              <article key={label} className="bg-[#141414] border border-white/10 rounded-2xl p-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#A1A1AA] underline decoration-white/20 underline-offset-4">{label}:</div>
                <p className="mt-1 text-[11px] text-zinc-500">{scopeLabel}</p>
                {totalCurrencies.map((currency) => {
                  const rows = scoped.filter((row) => row.moneda === currency);
                  const ingresos = rows.filter((row) => row.tipo === "Ingreso").reduce((total, row) => total + (Number(row.monto) || 0), 0);
                  const egresos = rows.filter((row) => row.tipo === "Egreso").reduce((total, row) => total + (Number(row.monto) || 0), 0);
                  const value = kind === "Ingreso" ? ingresos : kind === "Egreso" ? egresos : ingresos - egresos;
                  return <div key={currency} className="mt-2 font-display text-2xl">{money(value, currency)}</div>;
                })}
              </article>
            ))}
          </div>

          <div className="flex justify-end">
            <PrimaryButton onClick={() => openMove(blankMovimiento(user?.id))}>Registrar movimiento</PrimaryButton>
          </div>

          {filtered.length === 0 ? <Empty>No hay movimientos con esos filtros.</Empty> : (
            <div className="overflow-x-auto border border-white/10 rounded-2xl">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-[0.14em] text-[#A1A1AA]">
                  <tr>
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3">Descripción</th>
                    <th className="px-3 py-3">Rubro</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Monto</th>
                    <th className="px-3 py-3">Comprobante</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-t border-white/5">
                      <td className="px-3 py-3 whitespace-nowrap">{formatDate(row.fecha)}</td>
                      <td className="px-3 py-3">{row.concepto}<div className="text-xs text-[#A1A1AA]">{row.metodo_pago}</div></td>
                      <td className="px-3 py-3">{row.categoria}</td>
                      <td className="px-3 py-3">{row.tipo}</td>
                      <td className={`px-3 py-3 whitespace-nowrap ${row.tipo === "Ingreso" ? "text-emerald-300" : "text-red-300"}`}>{money(row.monto, row.moneda)}</td>
                      <td className="px-3 py-3">
                        {caja_comprobantes.filter((item) => item.movimiento_id === row.id && item.url_archivo).map((item) => (
                          <button key={item.id} type="button" className="grid h-10 w-14 place-items-center overflow-hidden rounded-md border border-white/10 bg-[#0A0A0A]" onClick={() => setArchivo({ src: item.url_archivo, name: item.nombre_archivo || item.tipo_comprobante })} aria-label="Ver comprobante">
                            {String(item.url_archivo).startsWith("data:image/") ? <img src={item.url_archivo} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-[#A1A1AA]">PDF</span>}
                          </button>
                        ))}
                        {!caja_comprobantes.some((item) => item.movimiento_id === row.id && item.url_archivo) && <span className="text-xs text-zinc-600">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button type="button" className="text-xs text-[#A1A1AA] hover:text-white" onClick={() => openMove(row)}>Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {archivo && <ArchivoViewer src={archivo.src} name={archivo.name} onClose={() => setArchivo(null)} />}
      {editor && (
        <Modal title={movimientos_caja.some((row) => row.id === editor.id) ? "Editar movimiento" : "Nuevo movimiento"} onClose={() => setEditor(null)}>
          <form onSubmit={submit} className="p-5 grid sm:grid-cols-2 gap-4">
            <Field label="Fecha"><input className={inputClass} type="date" value={String(editor.fecha || "").slice(0, 10)} onChange={(event) => setEditor({ ...editor, fecha: event.target.value })} required /></Field>
            <Field label="Tipo">
              <select className={inputClass} value={editor.tipo} onChange={(event) => setEditor({ ...editor, tipo: event.target.value })}>
                {TIPOS_CAJA.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Categoría">
              <select className={inputClass} value={editor.categoria} onChange={(event) => setEditor({ ...editor, categoria: event.target.value })}>
                {RUBROS.map((group) => (
                  <optgroup key={group.id} label={group.label}>
                    {group.categories.map((item) => <option key={item}>{item}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Método de pago">
              <select className={inputClass} value={editor.metodo_pago} onChange={(event) => setEditor({ ...editor, metodo_pago: event.target.value })}>
                {METODOS_PAGO.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descripción" hint="Qué se está cobrando o pagando. Ej: Seña del Gol Trend">
                <input className={inputClass} placeholder="Seña del Gol Trend" value={editor.concepto || ""} onChange={(event) => setEditor({ ...editor, concepto: event.target.value })} required />
              </Field>
            </div>
            <Field label="Monto"><input className={inputClass} type="number" value={editor.monto ?? 0} onChange={(event) => setEditor({ ...editor, monto: event.target.value })} required /></Field>
            <Field label="Moneda">
              <select className={inputClass} value={editor.moneda} onChange={(event) => setEditor({ ...editor, moneda: event.target.value })}>
                <option>ARS</option><option>USD</option>
              </select>
            </Field>
            <section className="sm:col-span-2 rounded-2xl border border-white/10 bg-[#0A0A0A] p-4">
              <h3 className="font-display uppercase tracking-wide">Comprobante</h3>
              <p className="mt-1 text-xs text-[#A1A1AA]">Opcional. Ticket, factura o transferencia. Tocá la imagen para verla completa.</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Tipo">
                  <select className={inputClass} value={comprobante.tipo_comprobante || "Ticket / Recibo"} onChange={(event) => setComprobante({ ...comprobante, tipo_comprobante: event.target.value })}>
                    {TIPOS_COMPROBANTE.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Número" hint="Opcional. Ej: 0001-00004521">
                  <input className={inputClass} placeholder="0001-00004521" value={comprobante.nro_comprobante || ""} onChange={(event) => setComprobante({ ...comprobante, nro_comprobante: event.target.value })} />
                </Field>
                <Field label="Archivo" hint="Foto o PDF.">
                  <input className={inputClass} type="file" accept="image/*,.pdf,application/pdf" onChange={onComprobante} />
                </Field>
                <div>
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA] underline decoration-white/30 underline-offset-4">Vista:</span>
                  <span className="mt-1 block text-[11px] text-zinc-500">Tocá para ampliarla.</span>
                  {comprobante.url_archivo ? (
                    <button type="button" className="mt-1.5 grid h-24 w-full place-items-center overflow-hidden rounded-lg border border-white/10 bg-black" onClick={() => setArchivo({ src: comprobante.url_archivo, name: comprobante.nombre_archivo || comprobante.tipo_comprobante })}>
                      {String(comprobante.url_archivo).startsWith("data:image/") ? <img src={comprobante.url_archivo} alt="" className="h-full w-full object-contain" /> : <span className="text-sm text-[#A1A1AA]">PDF listo</span>}
                    </button>
                  ) : (
                    <div className="mt-1.5 grid h-24 w-full place-items-center rounded-lg border border-dashed border-white/15 text-xs text-zinc-600">Sin archivo</div>
                  )}
                </div>
              </div>
            </section>
            <div className="sm:col-span-2 grid gap-4 lg:grid-cols-2">
              <ClienteFields
                clientes={clientes}
                clienteId={editor.cliente_id}
                nombre={editor.cliente_id ? (clientes.find((item) => item.id === editor.cliente_id)?.nombre || "") : (editor.cliente_manual || "")}
                telefono={editor.cliente_id ? (clientes.find((item) => item.id === editor.cliente_id)?.telefono || "") : (editor.cliente_telefono || "")}
                onChange={(next) => setEditor({ ...editor, cliente_id: next.clienteId, cliente_manual: next.nombre, cliente_telefono: next.telefono })}
                onCreate={() => setNewCliente(true)}
              />
              <VehiculoFields
                vehiculos={vehiculos}
                vehiculoId={editor.vehiculo_id}
                datos={editor.vehiculo_id ? `${vehicleLabel(vehiculos.find((item) => item.id === editor.vehiculo_id))} ${vehiculos.find((item) => item.id === editor.vehiculo_id)?.patente || ""}`.trim() : (editor.vehiculo_manual || "")}
                onChange={(next) => setEditor({ ...editor, vehiculo_id: next.vehiculoId, vehiculo_manual: next.datos })}
                onCreate={() => setNewVehiculo(true)}
              />
            </div>
            <Field label="Gestión">
              <select className={inputClass} value={editor.gestion_id || ""} onChange={(event) => setEditor({ ...editor, gestion_id: event.target.value || null })}>
                <option value="">Sin vincular</option>
                {gestiones.map((gestion) => <option key={gestion.id} value={gestion.id}>{gestion.sector}: {gestion.titulo}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2 flex justify-between gap-2">
              {movimientos_caja.some((row) => row.id === editor.id) && (
                <GhostButton onClick={() => { if (window.confirm("¿Eliminar este movimiento?")) { caja_comprobantes.filter((item) => item.movimiento_id === editor.id).forEach((item) => remove("caja_comprobantes", item.id)); remove("movimientos_caja", editor.id); setEditor(null); } }}>Eliminar</GhostButton>
              )}
              <PrimaryButton type="submit" className="ml-auto">Guardar</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
      {newCliente && editor && (
        <ClienteEditor
          initial={blankCliente(user?.id)}
          onClose={() => setNewCliente(false)}
          onSaved={(cliente) => {
            setEditor((current) => current && ({ ...current, cliente_id: cliente.id, cliente_manual: cliente.nombre, cliente_telefono: cliente.telefono || "" }));
            setNewCliente(false);
          }}
        />
      )}
      {newVehiculo && editor && (
        <VehiculoEditor
          initial={blankVehiculo(user?.id)}
          onClose={() => setNewVehiculo(false)}
          onSaved={(vehicle) => {
            setEditor((current) => current && ({ ...current, vehiculo_id: vehicle.id, vehiculo_manual: `${vehicleLabel(vehicle)} ${vehicle.patente || ""}`.trim() }));
            setNewVehiculo(false);
          }}
        />
      )}
    </div>
  );
}
