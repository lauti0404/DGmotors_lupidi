import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { membresiaVencida, sinMembresia } from "../lib/catalogo";
import { modalidadCanonica, tramitesDe } from "../lib/constants";
import { applyLocal, autorMovimiento, deleteDemoClients, discardDemoResidue, enqueue, flushQueue, loadProfile, loadQueue, loadTable, mergeRows, prepare, pullAll, pushOp, rememberAutorMovimiento, saveQueue, saveTable, withoutResidue } from "../lib/offline";
import { supabaseConfigured } from "../lib/supabase";

const DataContext = createContext(null);
const TABLES = ["clientes", "vehiculos", "gestiones", "gestion_documentos", "movimientos_caja", "caja_comprobantes", "membresias", "detailing_packs", "detailing_pack_items", "detailing_extras", "cliente_imagenes", "perfiles"];

function initialTables() {
  discardDemoResidue();
  return Object.fromEntries(TABLES.map((table) => [table, loadTable(table)]));
}

export function DataProvider({ children, userId }) {
  const [tables, setTables] = useState(initialTables);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(() => loadQueue().length);
  const [lastSyncError, setLastSyncError] = useState("");

  const remember = useCallback((nextPending, error) => {
    setPending(nextPending);
    setLastSyncError(error ? error.message || "No se pudo sincronizar." : "");
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      discardDemoResidue();
      setTables((current) => {
        const next = { ...current };
        for (const table of TABLES) next[table] = loadTable(table);
        return next;
      });
      if (loadProfile()?.local) {
        setLastSyncError("");
        setPending(0);
        return;
      }
      const flushed = await flushQueue();
      remember(flushed.pending, flushed.error);
      if (!navigator.onLine || !supabaseConfigured) return;
      try {
        await deleteDemoClients();
      } catch {
        // Si el cliente de prueba ya no está, el resto de la sincronización sigue.
      }
      const pulled = await pullAll();
      if (pulled.error) setLastSyncError(pulled.error.message || "No se pudieron leer todas las tablas.");
      const queue = loadQueue();
      const patch = {};
      for (const table of Object.keys(pulled.rows)) {
        patch[table] = withoutResidue(mergeRows(pulled.rows[table], queue, table));
        saveTable(table, patch[table]);
      }
      if (Object.keys(patch).length) setTables((current) => ({ ...current, ...patch }));
      setPending(loadQueue().length);
    } finally {
      setSyncing(false);
    }
  }, [remember]);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      void syncNow();
    };
    const onOffline = () => setOnline(false);
    const onSession = () => { void syncNow(); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("dg-session-ready", onSession);
    void syncNow();
    const timer = window.setInterval(() => {
      if (navigator.onLine && loadQueue().length) void syncNow();
    }, 20000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("dg-session-ready", onSession);
      window.clearInterval(timer);
    };
  }, [syncNow, userId]);

  const replicate = useCallback(async (table, action, payload) => {
    if (loadProfile()?.local) return;
    const op = { id: crypto.randomUUID(), table, action, payload, timestamp: Date.now() };
    if (navigator.onLine && supabaseConfigured) {
      try {
        await pushOp(op);
        const queue = loadQueue().filter((item) => !(item.table === table && item.payload?.id === payload.id));
        saveQueue(queue);
        setLastSyncError("");
        setPending(queue.length);
        return;
      } catch (error) {
        remember(enqueue(op).length, error);
        return;
      }
    }
    setPending(enqueue(op).length);
  }, [remember]);

  const save = useCallback((table, row) => {
    const localAccount = Boolean(loadProfile()?.local);
    const payload = prepare(table, {
      ...row,
      actualizado_en: new Date().toISOString(),
      ...(localAccount ? { creado_por: null, registrado_por: null } : {}),
    });
    if (table === "movimientos_caja") {
      const profile = loadProfile();
      const nombre = profile?.nombre || profile?.email || "";
      if (nombre && !autorMovimiento(payload.id)) rememberAutorMovimiento(payload.id, nombre);
    }
    const next = applyLocal(table, "UPSERT", payload);
    setTables((current) => ({ ...current, [table]: next }));
    void replicate(table, "UPSERT", payload);
    return payload;
  }, [replicate]);

  const remove = useCallback((table, id) => {
    const next = applyLocal(table, "DELETE", { id });
    setTables((current) => ({ ...current, [table]: next }));
    void replicate(table, "DELETE", { id });
  }, [replicate]);

  useEffect(() => {
    for (const cliente of tables.clientes || []) {
      if (!membresiaVencida(cliente)) continue;
      save("clientes", sinMembresia(cliente));
    }
  }, [tables.clientes, save]);

  useEffect(() => {
    for (const vehicle of tables.vehiculos || []) {
      const modalidad = modalidadCanonica(vehicle.modalidad);
      if (modalidad === vehicle.modalidad) continue;
      save("vehiculos", { ...vehicle, modalidad });
    }
  }, [tables.vehiculos, save]);

  useEffect(() => {
    for (const gestion of tables.gestiones || []) {
      if (gestion.sector !== "Gestoria" || gestion.checklist?.policial_opcional) continue;
      const tramites = tramitesDe(gestion.checklist);
      if (tramites.policial && !tramites.policial.obtenido) tramites.policial = { activo: false, obtenido: false };
      save("gestiones", { ...gestion, checklist: { ...(gestion.checklist || {}), tramites, policial_opcional: true } });
    }
  }, [tables.gestiones, save]);

  const value = useMemo(() => ({
    ...tables,
    online,
    syncing,
    pending,
    lastSyncError,
    configured: supabaseConfigured,
    userId,
    save,
    remove,
    syncNow,
  }), [tables, online, syncing, pending, lastSyncError, userId, save, remove, syncNow]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData fuera de DataProvider");
  return context;
}
