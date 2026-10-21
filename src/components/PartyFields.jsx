import { phoneLocal, vehicleLabel } from "../lib/format";
import { ClienteSearchSelect } from "./ClienteSearchSelect";
import { Field, GhostButton, inputClass } from "./ui";

export function ClienteFields({ clientes, vehiculos = [], clienteId, nombre, telefono, onChange, onCreate }) {
  const locked = Boolean(clienteId);
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <span className="block text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA] underline decoration-white/30 underline-offset-4">Cliente:</span>
          <div className="mt-1.5">
            <ClienteSearchSelect
              clientes={clientes}
              vehiculos={vehiculos}
              value={clienteId || ""}
              onChange={(id) => {
                const cliente = clientes.find((item) => item.id === id);
                onChange({
                  clienteId: id || null,
                  nombre: cliente?.nombre || "",
                  telefono: cliente?.telefono || "",
                });
              }}
            />
          </div>
        </div>
        <GhostButton className="w-36 shrink-0 whitespace-normal px-3 py-2 text-left text-xs leading-snug" onClick={onCreate}>Agregar nueva ficha de cliente</GhostButton>
      </div>
      <Field label="Nombre" hint={locked ? "Sale de la ficha elegida." : "Solo si todavía no tiene ficha."}>
        <input className={inputClass} value={nombre || ""} disabled={locked} onChange={(event) => onChange({ clienteId, nombre: event.target.value, telefono })} />
      </Field>
      <Field label="Teléfono" hint="Ej: 1150649934. Sin +54.">
        <input className={inputClass} inputMode="numeric" maxLength={10} placeholder="1150649934" value={telefono || ""} disabled={locked} onChange={(event) => onChange({ clienteId, nombre, telefono: phoneLocal(event.target.value) })} />
      </Field>
    </div>
  );
}

export function VehiculoFields({ vehiculos, vehiculoId, datos, onChange, onCreate }) {
  const locked = Boolean(vehiculoId);
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field label="Vehículo en stock">
            <select className={inputClass} value={vehiculoId || ""} onChange={(event) => {
              const vehicle = vehiculos.find((item) => item.id === event.target.value);
              onChange({
                vehiculoId: event.target.value || null,
                datos: vehicle ? `${vehicleLabel(vehicle)} ${vehicle.patente || ""}`.trim() : datos,
              });
            }}>
              <option value="">No está en stock, escribir a mano</option>
              {vehiculos.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicleLabel(vehicle)} {vehicle.patente}</option>)}
            </select>
          </Field>
        </div>
        <GhostButton className="w-36 shrink-0 whitespace-normal px-3 py-2 text-left text-xs leading-snug" onClick={onCreate}>Agregar vehículo</GhostButton>
      </div>
      <Field label="Nombre del vehículo" hint={locked ? "Sale de la unidad elegida." : "Si no está en stock. Ej: Gol Trend AB123CD"}>
        <input className={inputClass} placeholder="Gol Trend AB123CD" value={datos || ""} disabled={locked} onChange={(event) => onChange({ vehiculoId, datos: event.target.value })} />
      </Field>
    </div>
  );
}
