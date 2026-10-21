import { useEffect, useMemo, useState } from "react";
import { ClienteEditor } from "../components/ClienteEditor";
import { DocumentoEditor } from "../components/DocumentoEditor";
import { ConfirmacionCaja } from "../components/ConfirmacionCaja";
import { ClienteFields, VehiculoFields } from "../components/PartyFields";
import { TitulosObtenidos, TramitesGestoria } from "../components/TramitesGestoria";
import { VehiculoEditor } from "../components/VehiculoEditor";
import { Empty, Field, GhostButton, Modal, PrimaryButton, inputClass } from "../components/ui";
import { useAuth } from "../context/Auth";
import { useData } from "../context/Data";
import { ArchivoViewer } from "../components/ArchivoViewer";
import { ETAPAS_DETAILING, ETAPAS_GESTORIA, TIPOS_DOCUMENTO } from "../lib/constants";
import { EXTRAS_INICIAL, MEMBRESIAS_INICIAL, PACKS_INICIAL, filasVisibles, itemsDelPack, sinMembresia } from "../lib/catalogo";
import { comprimirImagenDataUrl } from "../lib/comprimirImagen";
import { downloadData } from "../lib/files";
import { amountOnly, formatDate, money, phoneError, phoneLocal, todayISO, vehicleLabel, waLink } from "../lib/format";
import { blankCliente, blankGestion, blankMovimiento, blankVehiculo } from "../lib/records";

function consumeQuick(kind) {
  if (sessionStorage.getItem("dg_quick_create") === kind) {
    sessionStorage.removeItem("dg_quick_create");
    return true;
  }
  return false;
}

function pasosOf(gestion) {
  const list = gestion.sector === "Detailing" ? ETAPAS_DETAILING : ETAPAS_GESTORIA;
  const stored = gestion.checklist?.pasos;
  if (stored && Object.keys(stored).length) return stored;
  const index = list.indexOf(gestion.etapa);
  return Object.fromEntries(list.map((item, itemIndex) => [item, index >= 0 && itemIndex <= index && index > 0 ? true : item === gestion.etapa]));
}

export function Gestiones({ sector = "Gestoria" }) {
  const { user } = useAuth();
  const { gestiones, clientes, vehiculos, gestion_documentos = [], movimientos_caja = [], perfiles = [], membresias = [], detailing_packs = [], detailing_pack_items = [], detailing_extras = [], save, remove } = useData();
  const [editor, setEditor] = useState(null);
  const [docEditor, setDocEditor] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const packs = filasVisibles(detailing_packs, PACKS_INICIAL);
  const extras = filasVisibles(detailing_extras, EXTRAS_INICIAL);
  const planes = filasVisibles(membresias, MEMBRESIAS_INICIAL);
  const packsSemilla = !detailing_packs.length;
  const [caja, setCaja] = useState(null);
  const [newCliente, setNewCliente] = useState(false);
  const [newVehiculo, setNewVehiculo] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const kind = sector === "Detailing" ? "detailing" : "gestion";
    if (consumeQuick(kind)) setEditor(blankGestion(user?.id, sector));
  }, [user, sector]);

  const etapas = sector === "Detailing" ? ETAPAS_DETAILING : ETAPAS_GESTORIA;
  const rows = useMemo(() => gestiones.filter((gestion) => gestion.sector === sector), [gestiones, sector]);
  const socios = clientes.filter((cliente) => cliente.membresia && cliente.membresia !== "Ninguna");
  const waClass = "inline-flex h-8 items-center justify-center rounded-full border border-emerald-400/40 px-3 text-center text-xs leading-none text-emerald-200 hover:border-emerald-300";

  function linkPeople(next) {
    const cliente = clientes.find((item) => item.id === next.cliente_id);
    const vehiculo = vehiculos.find((item) => item.id === next.vehiculo_id);
    return {
      ...next,
      cliente_nombre: cliente?.nombre || next.cliente_nombre,
      cliente_telefono: cliente?.telefono || next.cliente_telefono,
      vehiculo_datos: vehiculo ? `${vehicleLabel(vehiculo)} ${vehiculo.patente || ""}`.trim() : next.vehiculo_datos,
    };
  }

  function gestionLista(source) {
    const telefono = phoneLocal(source.cliente_telefono);
    return linkPeople({
      ...source,
      cliente_telefono: telefono,
      costo_interno: amountOnly(source.costo_interno) || 0,
      precio_cobrado: amountOnly(source.precio_cobrado) || 0,
    });
  }

  function propuestaCaja(row) {
    const detailing = row.sector === "Detailing";
    const precio = Number(row.precio_cobrado) || 0;
    const costo = Number(row.costo_interno) || 0;
    return {
      ingreso: {
        activo: precio > 0,
        monto: precio,
        concepto: row.titulo || (detailing ? "Detailing" : "Gestoría"),
        categoria: detailing ? "Servicio Detailing (Packs)" : "Cobro de Trámite / Transferencia",
        moneda: row.moneda || "ARS",
        metodo: "Efectivo",
      },
      egreso: {
        activo: costo > 0,
        monto: costo,
        concepto: `Costo ${row.titulo || (detailing ? "detailing" : "gestoría")}`,
        categoria: detailing ? "Insumos y Químicos de Detailing" : "Pago de Aranceles DNRPA / Informes / Sellados",
        moneda: row.moneda || "ARS",
        metodo: "Efectivo",
      },
    };
  }

  function abrirCaja(source, origen, cerrarEditor) {
    const row = gestionLista(source);
    if (!String(row.titulo || "").trim() && origen !== "cobrar" && origen !== "paso") {
      setFormError("Poné un título antes de pasarlo a caja.");
      return;
    }
    const problem = !row.cliente_id && phoneError(row.cliente_telefono);
    if (problem) {
      if (editor?.id === row.id) setFormError(problem);
      else window.alert(problem);
      return;
    }
    setFormError("");
    setCaja({ origen, cerrarEditor, row, ...propuestaCaja(row) });
  }

  function guardarGestion(row) {
    save("gestiones", row);
  }

  function submit(event) {
    event.preventDefault();
    if (!editor.titulo.trim()) return;
    const next = gestionLista(editor);
    const problem = !next.cliente_id && phoneError(next.cliente_telefono);
    if (problem) {
      setFormError(problem);
      return;
    }
    const exists = gestiones.some((gestion) => gestion.id === next.id);
    const hasMoney = Number(next.precio_cobrado) > 0 || Number(next.costo_interno) > 0;
    if (!exists && hasMoney) {
      setCaja({ origen: "guardar", cerrarEditor: true, row: next, ...propuestaCaja(next) });
      return;
    }
    guardarGestion(next);
    setEditor(null);
  }

  function togglePaso(gestion, paso) {
    const pasos = { ...pasosOf(gestion), [paso]: !pasosOf(gestion)[paso] };
    const marked = etapas.filter((item) => pasos[item]);
    const next = {
      ...gestion,
      etapa: marked.at(-1) || etapas[0],
      checklist: { ...(gestion.checklist || {}), pasos },
    };
    save("gestiones", next);
    const finished = pasos[paso] && (paso === "Finalizado" || paso === "Listo");
    const hasMoney = Number(next.precio_cobrado) > 0 || Number(next.costo_interno) > 0;
    if (finished && hasMoney) setCaja({ origen: "paso", cerrarEditor: false, row: next, ...propuestaCaja(next) });
  }

  function impactarCaja(row, impacto) {
    const base = {
      vehiculo_id: row.vehiculo_id,
      gestion_id: row.id,
      cliente_id: row.cliente_id,
    };
    if (impacto.ingreso && Number(impacto.ingreso.monto) > 0) {
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
    if (impacto.egreso && Number(impacto.egreso.monto) > 0) {
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
  }

  function confirmarCaja(impacto) {
    const row = { ...caja.row, pagado: (impacto.ingreso && Number(impacto.ingreso.monto) > 0) || Boolean(caja.row.pagado) };
    impactarCaja(row, impacto);
    guardarGestion(row);
    if (editor?.id === row.id) setEditor(row);
    if (caja.cerrarEditor) setEditor(null);
    setCaja(null);
  }

  function omitirCaja() {
    if (caja.origen === "guardar") {
      guardarGestion(caja.row);
      setEditor(null);
    }
    setCaja(null);
  }

  function closeEditor() {
    if (editor && !gestiones.some((item) => item.id === editor.id)) {
      for (const doc of gestion_documentos.filter((item) => item.gestion_id === editor.id)) remove("gestion_documentos", doc.id);
    }
    setEditor(null);
  }

  function removeGestion(id) {
    for (const doc of gestion_documentos.filter((item) => item.gestion_id === id)) remove("gestion_documentos", doc.id);
    remove("gestiones", id);
  }

  function openDocumento(gestion, tipo, existing) {
    const current = existing || (tipo === "Otro" ? null : gestion_documentos.find((item) => item.gestion_id === gestion.id && item.tipo_documento === tipo));
    setDocEditor(current || {
      id: crypto.randomUUID(),
      gestion_id: gestion.id,
      tipo_documento: tipo,
      estado_documento: "Recibido",
      url_archivo: "",
      nombre_archivo: "",
      observaciones: "",
      creado_en: new Date().toISOString(),
    });
  }

  async function adjuntarFotos(gestionId, tipo, files) {
    const known = perfiles.some((item) => item.id === user?.id);
    for (const file of files) {
      try {
        const url = await comprimirImagenDataUrl(file);
        save("gestion_documentos", {
          id: crypto.randomUUID(),
          gestion_id: gestionId,
          tipo_documento: tipo,
          estado_documento: "Recibido",
          url_archivo: url,
          nombre_archivo: file.name || tipo,
          observaciones: "",
          subido_por: known ? user.id : null,
          creado_en: new Date().toISOString(),
        });
      } catch (caught) {
        window.alert(caught.message);
      }
    }
  }

  function saveDocumento(doc) {
    const known = perfiles.some((item) => item.id === user?.id);
    save("gestion_documentos", { ...doc, subido_por: known ? user.id : null });
    setDocEditor(null);
  }

  function downloadDocumento(doc) {
    downloadData(doc.url_archivo, doc.nombre_archivo || "documento");
  }

  function usarLavado(cliente) {
    save("clientes", {
      ...cliente,
      lavados_usados: Number(cliente.lavados_usados || 0) + 1,
      ultimo_servicio: todayISO(),
    });
  }

  function quitarMembresia(cliente) {
    if (!window.confirm(`¿Quitar la membresía de ${cliente.nombre}? Se borra de su ficha.`)) return;
    save("clientes", sinMembresia(cliente));
  }

  function elegirServicio(packId, extraIds) {
    const pack = packs.find((item) => item.id === packId);
    const chosen = extras.filter((item) => extraIds.includes(item.id));
    const moneda = pack?.moneda || chosen[0]?.moneda || editor.moneda || "ARS";
    const precio = (pack && (pack.moneda || "ARS") === moneda ? Number(pack.precio) || 0 : 0)
      + chosen.filter((item) => (item.moneda || "ARS") === moneda).reduce((total, item) => total + (Number(item.precio) || 0), 0);
    const notas = pack ? itemsDelPack(pack.id, detailing_pack_items, packsSemilla).map((item) => `• ${item.descripcion_item}`).join("\n") : "";
    const titulo = [pack?.nombre, ...chosen.map((item) => item.nombre)].filter(Boolean).join(" + ");
    setEditor({
      ...editor,
      pack_id: packId,
      extra_ids: extraIds,
      titulo: titulo || editor.titulo,
      precio_cobrado: precio,
      moneda,
      notas: !editor.notas?.trim() || editor.pack_id !== packId ? notas : editor.notas,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PrimaryButton onClick={() => setEditor(blankGestion(user?.id, sector))}>{sector === "Detailing" ? "Nuevo trabajo" : "Nueva gestoría"}</PrimaryButton>
      </div>

      {rows.length === 0 ? <Empty>Todavía no hay {sector === "Detailing" ? "trabajos de detailing" : "gestorías"}.</Empty> : (
        <div className="space-y-4">
          {rows.map((gestion) => {
            const pasos = pasosOf(gestion);
            const done = etapas.filter((etapa) => pasos[etapa]).length;
            const accent = gestion.pagado ? "bg-emerald-400" : done === etapas.length ? "bg-sky-400" : "bg-[#DC2626]";
            const docs = gestion_documentos.filter((item) => item.gestion_id === gestion.id);
            const whatsapp = sector === "Detailing" ? waLink(gestion.cliente_telefono, `Hola, te escribo de DG Motors por ${gestion.titulo || "tu trabajo"}.`) : "";
            const facts = [
              ["Cliente", gestion.cliente_nombre || "Sin cliente"],
              ["Teléfono", gestion.cliente_telefono || "Sin teléfono"],
              ["Vehículo", gestion.vehiculo_datos || "Sin vehículo"],
              ["Ingreso", formatDate(gestion.fecha_ingreso)],
              ["Precio", money(gestion.precio_cobrado, gestion.moneda)],
              ["Cobro", gestion.pagado ? "Cobrado" : "Impago"],
            ];
            return (
              <article key={gestion.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#101010]">
                <div className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
                <div className="space-y-4 p-5 pl-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[#DC2626]">{sector === "Detailing" ? "Detailing" : "Gestoría"}</p>
                      <h2 className="mt-1 font-display text-3xl uppercase leading-none tracking-wide">{gestion.titulo || "Sin título"}</h2>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl leading-none">{money(gestion.precio_cobrado, gestion.moneda)}</div>
                      <div className={`mt-2 text-[11px] uppercase tracking-[0.16em] ${gestion.pagado ? "text-emerald-300" : "text-amber-200"}`}>{gestion.pagado ? "Cobrado" : "Impago"}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 lg:grid-cols-6">
                    {facts.map(([label, value]) => (
                      <div key={label} className="bg-[#0A0A0A] px-3 py-3">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-[#A1A1AA] underline decoration-white/20 underline-offset-4">{label}:</div>
                        <div className="mt-1.5 text-sm leading-snug">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[#A1A1AA]">
                      <span>Proceso</span>
                      <span>{done} de {etapas.length}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-[#DC2626]" style={{ width: `${(done / etapas.length) * 100}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {etapas.map((etapa) => (
                        <button key={etapa} type="button" onClick={() => togglePaso(gestion, etapa)} className={`rounded-lg border px-3 py-2 text-left text-xs ${pasos[etapa] ? "border-[#DC2626] bg-[#DC2626] text-white" : "border-white/10 bg-[#0A0A0A] text-[#A1A1AA] hover:border-white/30 hover:text-white"}`}>
                          {etapa}
                        </button>
                      ))}
                    </div>
                  </div>
                  {sector === "Gestoria" && <TitulosObtenidos checklist={gestion.checklist} />}
                  {sector === "Gestoria" && (
                    <div>
                      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#A1A1AA]">Documentación con la que contamos</div>
                      <div className="flex flex-wrap gap-2">
                        {TIPOS_DOCUMENTO.map((tipo) => {
                          const doc = docs.find((item) => item.tipo_documento === tipo);
                          const ready = doc && doc.estado_documento !== "Pendiente";
                          return (
                            <button key={tipo} type="button" onClick={() => openDocumento(gestion, tipo)} className={`rounded-lg border px-3 py-2 text-left text-xs ${ready ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-[#0A0A0A] text-[#A1A1AA] hover:border-white/30 hover:text-white"}`}>
                              {tipo}{doc ? ` · ${doc.estado_documento}` : ""}
                            </button>
                          );
                        })}
                      </div>
                      {docs.some((item) => item.url_archivo) && (
                        <div className="mt-3 space-y-2">
                          {docs.filter((item) => item.url_archivo).map((doc) => (
                            <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0A0A0A] px-3 py-2 text-sm">
                              <span className="min-w-0">{doc.tipo_documento}<span className="mt-0.5 block text-xs text-[#A1A1AA]">{doc.nombre_archivo || "Archivo"}{doc.observaciones ? ` · ${doc.observaciones}` : ""}</span></span>
                              <span className="flex gap-2">
                                <button type="button" className="text-xs text-[#A1A1AA] hover:text-white" onClick={() => openDocumento(gestion, doc.tipo_documento, doc)}>Editar</button>
                                <button type="button" className="text-xs text-white underline" onClick={() => setArchivo({ src: doc.url_archivo, name: doc.nombre_archivo || doc.tipo_documento })}>Ver</button>
                                <button type="button" className="text-xs text-[#A1A1AA] hover:text-white" onClick={() => downloadDocumento(doc)}>Descargar</button>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <GhostButton className="px-3 py-1.5 text-xs" onClick={() => setEditor(gestion)}>Editar</GhostButton>
                    {whatsapp && <a className={waClass} href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}
                    {!gestion.pagado && <PrimaryButton className="px-3 py-1.5 text-xs" onClick={() => abrirCaja(gestion, "cobrar", false)}>Cobrar</PrimaryButton>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {sector === "Detailing" && (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101010]">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="font-display text-[11px] uppercase tracking-[0.22em] text-[#DC2626]">Detailing</p>
            <h2 className="mt-1 font-display text-3xl uppercase leading-none">Membresías</h2>
          </div>
          {socios.length === 0 ? <div className="p-5"><Empty>Todavía no hay socios. Se cargan desde la ficha del cliente.</Empty></div> : (
            <div className="flex flex-col gap-px bg-white/10">
              {socios.map((cliente) => {
                const plan = planes.find((item) => item.nombre === cliente.membresia);
                const total = Number(cliente.lavados_totales) || Number(plan?.lavados_totales) || 0;
                const used = Number(cliente.lavados_usados) || 0;
                const width = total ? Math.min(100, (used / total) * 100) : 0;
                const finished = total > 0 && used >= total;
                return (
                  <article key={cliente.id} className="bg-[#0A0A0A] p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-display text-2xl uppercase leading-none">{cliente.nombre}</div>
                        <div className="mt-2 text-xs uppercase tracking-[0.14em] text-[#A1A1AA]">{cliente.membresia} · último {formatDate(cliente.ultimo_servicio)}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {waLink(cliente.telefono) && <a className={waClass} href={waLink(cliente.telefono, `Hola ${cliente.nombre}, te escribo de DG Motors por tu membresía ${cliente.membresia}.`)} target="_blank" rel="noreferrer">WhatsApp</a>}
                        <PrimaryButton className="px-3 py-1.5 text-xs" onClick={() => usarLavado(cliente)} disabled={finished}>Usar 1</PrimaryButton>
                        <GhostButton className="px-3 py-1.5 text-xs" onClick={() => quitarMembresia(cliente)}>Eliminar</GhostButton>
                      </div>
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full ${finished ? "bg-amber-300" : "bg-[#DC2626]"}`} style={{ width: `${width}%` }} />
                    </div>
                    <p className={`mt-2 text-xs ${finished ? "text-amber-200" : "text-[#A1A1AA]"}`}>{used} de {total} lavados{finished ? ". Si no la quitás, a los 4 meses de completada se borra sola de la ficha." : ""}</p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {editor && (
        <Modal title={sector === "Detailing" ? "Detailing" : "Gestoría"} subtitle={editor.etapa} onClose={closeEditor} wide>
          <form onSubmit={submit} className="p-5 grid sm:grid-cols-2 gap-4">
            {sector === "Detailing" && (
              <div className="sm:col-span-2 space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA]">Pack</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {packs.map((pack) => (
                      <button key={pack.id} type="button" className={`rounded-full border px-3 py-1.5 text-xs ${editor.pack_id === pack.id ? "border-[#DC2626] text-white" : "border-white/10 text-[#A1A1AA] hover:border-[#DC2626]"}`} onClick={() => elegirServicio(editor.pack_id === pack.id ? null : pack.id, editor.extra_ids || [])}>
                        {pack.nombre}{Number(pack.precio) ? ` · ${money(pack.precio, pack.moneda)}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA]">Extras</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {extras.map((extra) => {
                      const active = (editor.extra_ids || []).includes(extra.id);
                      return (
                        <button key={extra.id} type="button" className={`rounded-full border px-3 py-1.5 text-xs ${active ? "border-[#DC2626] text-white" : "border-white/10 text-[#A1A1AA] hover:border-[#DC2626]"}`} onClick={() => {
                          const ids = editor.extra_ids || [];
                          elegirServicio(editor.pack_id, active ? ids.filter((id) => id !== extra.id) : [...ids, extra.id]);
                        }}>
                          {extra.nombre}{Number(extra.precio) ? ` · ${money(extra.precio, extra.moneda)}` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            <Field label="Título"><input className={inputClass} value={editor.titulo || ""} onChange={(event) => setEditor({ ...editor, titulo: event.target.value })} required /></Field>
            <Field label="Fecha de ingreso"><input className={inputClass} type="date" value={String(editor.fecha_ingreso || "").slice(0, 10)} onChange={(event) => setEditor({ ...editor, fecha_ingreso: event.target.value })} /></Field>
            <ClienteFields
              clientes={clientes}
              vehiculos={vehiculos}
              clienteId={editor.cliente_id}
              nombre={editor.cliente_nombre}
              telefono={editor.cliente_telefono}
              onChange={(next) => setEditor({ ...editor, cliente_id: next.clienteId, cliente_nombre: next.nombre, cliente_telefono: next.telefono })}
              onCreate={() => setNewCliente(true)}
            />
            <VehiculoFields
              vehiculos={vehiculos}
              vehiculoId={editor.vehiculo_id}
              datos={editor.vehiculo_datos}
              onChange={(next) => setEditor({ ...editor, vehiculo_id: next.vehiculoId, vehiculo_datos: next.datos })}
              onCreate={() => setNewVehiculo(true)}
            />
            <Field label="Costo interno"><input className={inputClass} inputMode="numeric" maxLength={10} value={amountOnly(editor.costo_interno) || 0} onChange={(event) => setEditor({ ...editor, costo_interno: amountOnly(event.target.value) || 0 })} /></Field>
            <Field label="Precio cobrado"><input className={inputClass} inputMode="numeric" maxLength={10} value={amountOnly(editor.precio_cobrado) || 0} onChange={(event) => setEditor({ ...editor, precio_cobrado: amountOnly(event.target.value) || 0 })} /></Field>
            <Field label="Moneda">
              <select className={inputClass} value={editor.moneda} onChange={(event) => setEditor({ ...editor, moneda: event.target.value })}>
                <option>ARS</option><option>USD</option>
              </select>
            </Field>
            {sector === "Gestoria" && (
              <div className="sm:col-span-2">
                <TramitesGestoria
                  checklist={editor.checklist}
                  documentos={gestion_documentos.filter((item) => item.gestion_id === editor.id)}
                  onChange={(checklist) => setEditor({ ...editor, checklist })}
                  onAdd={(tipo, files) => adjuntarFotos(editor.id, tipo, files)}
                  onOpen={(doc) => setArchivo({ src: doc.url_archivo, name: doc.nombre_archivo || doc.tipo_documento })}
                  onDelete={(doc) => remove("gestion_documentos", doc.id)}
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(editor.pagado)} onChange={(event) => {
                const pagado = event.target.checked;
                const next = { ...editor, pagado };
                setEditor(next);
                if (pagado) abrirCaja(next, "pagado", false);
              }} />
              Ya está cobrado
            </label>
            <Field label="Notas"><textarea className={`${inputClass} min-h-24`} value={editor.notas || ""} onChange={(event) => setEditor({ ...editor, notas: event.target.value })} /></Field>
            {formError && <p className="sm:col-span-2 text-sm text-red-300">{formError}</p>}
            <div className="sm:col-span-2 flex flex-wrap justify-between gap-2">
              {gestiones.some((gestion) => gestion.id === editor.id) && (
                <GhostButton onClick={() => { if (window.confirm("¿Eliminar esta gestión?")) { removeGestion(editor.id); setEditor(null); } }}>Eliminar</GhostButton>
              )}
              <div className="ml-auto flex gap-2">
                <GhostButton onClick={() => abrirCaja(editor, "cobrar", false)}>Cobrar</GhostButton>
                <PrimaryButton type="submit">Guardar</PrimaryButton>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {newCliente && editor && (
        <ClienteEditor
          initial={blankCliente(user?.id)}
          onClose={() => setNewCliente(false)}
          onSaved={(cliente) => {
            setEditor((current) => current && ({ ...current, cliente_id: cliente.id, cliente_nombre: cliente.nombre, cliente_telefono: cliente.telefono || "" }));
            setNewCliente(false);
          }}
        />
      )}
      {newVehiculo && editor && (
        <VehiculoEditor
          initial={blankVehiculo(user?.id)}
          onClose={() => setNewVehiculo(false)}
          onSaved={(vehicle) => {
            setEditor((current) => current && ({ ...current, vehiculo_id: vehicle.id, vehiculo_datos: `${vehicleLabel(vehicle)} ${vehicle.patente || ""}`.trim() }));
            setNewVehiculo(false);
          }}
        />
      )}

      {archivo && <ArchivoViewer src={archivo.src} name={archivo.name} onClose={() => setArchivo(null)} />}

      {docEditor && (
        <DocumentoEditor
          initial={docEditor}
          onClose={() => setDocEditor(null)}
          onSaved={saveDocumento}
          onDelete={gestion_documentos.some((item) => item.id === docEditor.id) ? () => { remove("gestion_documentos", docEditor.id); setDocEditor(null); } : null}
        />
      )}

      {caja && (
        <ConfirmacionCaja
          titulo="Impactar en caja"
          subtitulo={caja.row.titulo}
          ingreso={caja.ingreso}
          egreso={caja.egreso}
          aviso={movimientos_caja.some((row) => row.gestion_id === caja.row.id) ? "Esta gestión ya tiene movimientos en caja. Confirmar agrega otros." : ""}
          textoOmitir={caja.origen === "guardar" ? "Guardar sin impactar en caja" : "Ahora no"}
          onClose={() => setCaja(null)}
          onOmitir={omitirCaja}
          onConfirm={confirmarCaja}
        />
      )}
    </div>
  );
}
