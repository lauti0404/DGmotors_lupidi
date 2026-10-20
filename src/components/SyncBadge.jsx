export function SyncBadge({ online, syncing, pending }) {
  let tone = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  let dot = "bg-emerald-300";
  let label = "Conectado y Sincronizado";

  if (syncing) {
    tone = "bg-sky-500/15 text-sky-200 border-sky-500/30";
    dot = "bg-sky-300";
    label = "Sincronizando...";
  } else if (!online || pending > 0) {
    tone = "bg-amber-500/15 text-amber-200 border-amber-500/30";
    dot = "bg-amber-300";
    label = `Modo Offline - ${pending} cambios guardados localmente`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ${tone}`}>
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </span>
    </div>
  );
}
