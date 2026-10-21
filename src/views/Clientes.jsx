import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/Auth";
import { useData } from "../context/Data";
import { CATEGORIAS_CLIENTE } from "../lib/constants";
import { MEMBRESIAS_INICIAL, filasVisibles } from "../lib/catalogo";
import { ArchivoViewer } from "../components/ArchivoViewer";
import { ClienteEditor } from "../components/ClienteEditor";
import { ClienteImagenes } from "../components/ClienteImagenes";
import { categoryList, formatDate, money, vehicleLabel, waLink } from "../lib/format";
import { blankCliente } from "../lib/records";
import { Avatar, Empty, GhostButton, Modal, Pill, Plate, PrimaryButton, inputClass } from "../components/ui";

export function Clientes() {
  const { user } = useAuth();
  const { clientes, vehiculos, gestiones, movimientos_caja, membresias = [] } = useData();
  const planes = ["Todas", "Ninguna", ...filasVisibles(membresias, MEMBRESIAS_INICIAL).map((item) => item.nombre)];
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [membresia, setMembresia] = useState("Todas");
  const [editor, setEditor] = useState(null);
  const [active, setActive] = useState(null);
  const [foto, setFoto] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem("dg_quick_create") === "cliente") {
      sessionStorage.removeItem("dg_quick_create");
      setEditor(blankCliente(user?.id));
    }
  }, [user]);

  const visible = useMemo(() => clientes.filter((cliente) => {
    const text = `${cliente.nombre} ${cliente.telefono} ${cliente.patente} ${cliente.dni_cuit}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (categoria !== "Todas" && !categoryList(cliente.categoria).includes(categoria)) return false;
    if (membresia !== "Todas" && cliente.membresia !== membresia) return false;
    return true;
  }), [clientes, query, categoria, membresia]);

  const history = active ? {
    vehiculos: vehiculos.filter((vehicle) => vehicle.cliente_duenio_id === active.id || vehicle.cliente_comprador_id === active.id),
    gestiones: gestiones.filter((gestion) => gestion.cliente_id === active.id),
    pagos: movimientos_caja.filter((row) => row.cliente_id === active.id),
  } : null;
  const whatsapp = active ? waLink(active.telefono, `Hola ${active.nombre}, soy DG Motors.`) : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input className={`${inputClass} max-w-xs`} placeholder="Buscar nombre, teléfono o patente" value={query} onChange={(event) => setQuery(event.target.value)} />
        <PrimaryButton onClick={() => setEditor(blankCliente(user?.id))}>Agregar cliente</PrimaryButton>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Todas", ...CATEGORIAS_CLIENTE].map((item) => <Pill key={item} active={categoria === item} onClick={() => setCategoria(item)}>{item}</Pill>)}
      </div>
      <div className="flex flex-wrap gap-2">
        {planes.map((item) => <Pill key={item} active={membresia === item} onClick={() => setMembresia(item)}>{item}</Pill>)}
      </div>

      {visible.length === 0 ? <Empty>No hay clientes con ese filtro.</Empty> : (
        <div className="grid md:grid-cols-2 gap-3">
          {visible.map((cliente) => (
            <div key={cliente.id} className="bg-[#141414] border border-white/10 rounded-2xl p-4 flex gap-3 hover:border-[#DC2626]">
              {cliente.foto_url ? (
                <button type="button" className="h-10 w-10 shrink-0 overflow-hidden rounded-full" onClick={() => setFoto(cliente)} aria-label={`Ver foto de ${cliente.nombre}`}>
                  <img src={cliente.foto_url} alt="" className="h-full w-full object-cover" />
                </button>
              ) : <Avatar name={cliente.nombre} />}
              <button type="button" onClick={() => setActive(cliente)} className="min-w-0 flex-1 text-left">
              <span className="min-w-0">
                <span className="block font-semibold truncate">{cliente.nombre}</span>
                <span className="block text-xs text-[#A1A1AA] mt-1">{categoryList(cliente.categoria).join(" · ") || "Sin categoría"} · {cliente.membresia}</span>
                <span className="block text-xs text-[#A1A1AA] mt-1">{cliente.telefono || "Sin teléfono"} {cliente.patente ? `· ${cliente.patente}` : ""}</span>
              </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {editor && <ClienteEditor initial={editor} onClose={() => setEditor(null)} />}
      {foto?.foto_url && <ArchivoViewer src={foto.foto_url} name={foto.nombre} onClose={() => setFoto(null)} />}

      {active && history && (
        <Modal title={active.nombre} subtitle={`${active.categoria} · ${active.membresia}`} onClose={() => setActive(null)} wide>
          <div className="p-5 space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#A1A1AA]">
              {active.foto_url && (
                <button type="button" className="h-16 w-16 overflow-hidden rounded-full border border-white/15" onClick={() => setFoto(active)}>
                  <img src={active.foto_url} alt="" className="h-full w-full object-cover" />
                </button>
              )}
              <Plate>{active.patente}</Plate>
              <span>{active.telefono || "Sin teléfono"}</span>
              <span>{active.email}</span>
              <span>{active.vehiculo_actual}</span>
              {whatsapp && <a className="rounded-full bg-[#DC2626] text-white px-3 py-1.5 text-xs font-semibold" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}
              <GhostButton className="px-3 py-1.5 text-xs" onClick={() => { setEditor(active); setActive(null); }}>Editar</GhostButton>
            </div>
            {active.notas && <p className="text-sm">{active.notas}</p>}
            <ClienteImagenes clienteId={active.id} />
            <section>
              <h3 className="font-display uppercase tracking-wide mb-2">Vehículos</h3>
              {history.vehiculos.length === 0 ? <p className="text-sm text-[#A1A1AA]">Ninguno vinculado.</p> : history.vehiculos.map((vehicle) => (
                <p key={vehicle.id} className="text-sm border-b border-white/5 py-2">{vehicleLabel(vehicle)} · {vehicle.patente} · {vehicle.estado} · {vehicle.cliente_duenio_id === active.id ? "Dueño" : "Comprador"}</p>
              ))}
            </section>
            <section>
              <h3 className="font-display uppercase tracking-wide mb-2">Gestiones</h3>
              {history.gestiones.length === 0 ? <p className="text-sm text-[#A1A1AA]">Ninguna vinculada.</p> : history.gestiones.map((gestion) => (
                <p key={gestion.id} className="text-sm border-b border-white/5 py-2">{gestion.sector} · {gestion.titulo} · {gestion.etapa} · {money(gestion.precio_cobrado, gestion.moneda)}</p>
              ))}
            </section>
            <section>
              <h3 className="font-display uppercase tracking-wide mb-2">Pagos en caja</h3>
              {history.pagos.length === 0 ? <p className="text-sm text-[#A1A1AA]">Ningún movimiento vinculado.</p> : history.pagos.map((row) => (
                <p key={row.id} className="text-sm border-b border-white/5 py-2">{formatDate(row.fecha)} · {row.tipo} · {row.categoria} · {money(row.monto, row.moneda)}</p>
              ))}
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}
