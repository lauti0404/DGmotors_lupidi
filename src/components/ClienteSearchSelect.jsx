import { useMemo, useState } from "react";
import { inputClass } from "./ui";

function blobDe(cliente, vehiculos) {
  const autos = (vehiculos || []).filter((item) => item.cliente_duenio_id === cliente.id || item.cliente_comprador_id === cliente.id);
  return [
    cliente.nombre,
    cliente.telefono,
    cliente.dni_cuit,
    cliente.patente,
    cliente.vehiculo_actual,
    ...autos.map((item) => `${item.patente || ""} ${item.marca || ""} ${item.modelo || ""}`),
  ].join(" ").toLowerCase();
}

export function ClienteSearchSelect({ clientes = [], vehiculos = [], value, onChange, emptyLabel = "Sin ficha, escribir a mano" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = clientes.find((item) => item.id === value);
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return clientes;
    return clientes.filter((cliente) => blobDe(cliente, vehiculos).includes(text));
  }, [clientes, vehiculos, query]);

  function choose(id) {
    onChange(id || "");
    setQuery("");
    setOpen(false);
  }

  return (
    <div>
      <button type="button" className={`${inputClass} text-left`} onClick={() => setOpen((current) => !current)}>
        {selected?.nombre || emptyLabel}
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-white/10 bg-[#0A0A0A] p-2">
          <input
            className={inputClass}
            autoFocus
            placeholder="Nombre, teléfono o patente"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
            <li>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#A1A1AA] hover:bg-white/5 hover:text-white" onClick={() => choose("")}>
                {emptyLabel}
              </button>
            </li>
            {filtered.map((cliente) => (
              <li key={cliente.id}>
                <button type="button" className="w-full rounded-lg px-3 py-2 text-left hover:bg-white/5" onClick={() => choose(cliente.id)}>
                  <span className="block text-sm">{cliente.nombre}</span>
                  <span className="block text-xs text-[#A1A1AA]">{[cliente.telefono, cliente.patente].filter(Boolean).join(" · ") || "Sin teléfono"}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-2 text-xs text-[#A1A1AA]">Nadie coincide con esa búsqueda.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
