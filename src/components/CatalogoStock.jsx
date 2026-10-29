import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { generarCatalogoPdf, NOMBRE_CATALOGO } from "../lib/catalogoPdf";
import { BUSINESS_IG, BUSINESS_PHONE, formatDate, formatKm, money, todayISO, vehicleLabel } from "../lib/format";
import { vehiclePhoto } from "../lib/images";
import { Plate } from "./ui";

function dato(value) {
  const text = String(value || "").trim();
  return text || "—";
}

function precioPublico(vehicle) {
  if (!Number(vehicle.precio_venta)) return "Consultar";
  return money(vehicle.precio_venta, vehicle.moneda);
}

export function CatalogoStock({ vehiculos = [], onClose }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const fecha = formatDate(todayISO());
  const lista = useMemo(() => (
    vehiculos
      .filter((vehicle) => vehicle.estado === "Disponible")
      .sort((a, b) => vehicleLabel(a).localeCompare(vehicleLabel(b), "es"))
  ), [vehiculos]);
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState("");
  const descargaEnCurso = useRef(false);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!lista.length) return undefined;
    let vigente = true;
    generarCatalogoPdf(lista).then((pdf) => {
      if (vigente) setArchivo(pdf);
    }).catch(() => {
      if (vigente) setError("No se pudo armar el PDF.");
    });
    return () => {
      vigente = false;
    };
  }, [lista]);

  function guardarEnlace() {
    const url = URL.createObjectURL(archivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = NOMBRE_CATALOGO;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2500);
  }

  async function compartir() {
    if (!archivo) return "vacio";
    const file = new File([archivo], NOMBRE_CATALOGO, { type: "application/pdf" });
    if (!navigator.canShare?.({ files: [file] })) return "no";
    try {
      await navigator.share({ files: [file], title: "Stock disponible · DG Motors" });
      return "ok";
    } catch (shareError) {
      if (shareError?.name === "AbortError") return "ok";
      return "fallo";
    }
  }

  async function descargar() {
    if (!archivo || descargaEnCurso.current) return;
    descargaEnCurso.current = true;
    window.setTimeout(() => {
      descargaEnCurso.current = false;
    }, 1500);
    setError("");
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (ios) {
      const resultado = await compartir();
      if (resultado === "no") guardarEnlace();
      if (resultado === "fallo") setError("No se pudo guardar el PDF.");
      return;
    }
    guardarEnlace();
  }

  async function enviar() {
    if (!archivo) return;
    setError("");
    const resultado = await compartir();
    if (resultado === "no") setError("Este navegador no puede compartir el archivo. Descargalo y envialo desde ahí.");
    if (resultado === "fallo") setError("No se pudo abrir el menú para compartir.");
  }

  return createPortal(
    <div className="catalogo-overlay">
      <div className="catalogo-barra">
        <div>
          <p className="catalogo-barra-titulo">Catálogo para clientes</p>
          <p className="catalogo-ayuda">Descargar guarda el PDF en el dispositivo. Compartir lo abre para enviarlo por WhatsApp, mail u otra app.</p>
          {error && <p className="catalogo-error">{error}</p>}
        </div>
        <div className="catalogo-acciones">
          <button type="button" className="catalogo-cerrar" onClick={onClose}>Cerrar</button>
          <button type="button" className="catalogo-compartir" onClick={enviar} disabled={!archivo}>Compartir</button>
          <button type="button" className="catalogo-guardar" onClick={descargar} disabled={!archivo}>
            {lista.length && !archivo && !error ? "Preparando PDF…" : "Descargar PDF"}
          </button>
        </div>
      </div>

      <article className="catalogo-hoja">
        <header className="catalogo-encabezado">
          <img src="/logo.png" alt="DG Motors" className="catalogo-logo" />
          <div>
            <h1 className="catalogo-marca">Stock disponible</h1>
            <p className="catalogo-meta">DG Motors · {fecha}</p>
            <p className="catalogo-meta">{BUSINESS_PHONE} · @{BUSINESS_IG}</p>
          </div>
        </header>

        {lista.length === 0 ? (
          <p className="catalogo-vacio">No hay vehículos disponibles para armar el catálogo.</p>
        ) : (
          <div className="catalogo-grilla">
            {lista.map((vehicle) => {
              const photo = vehiclePhoto(vehicle);
              return (
                <section key={vehicle.id} className="catalogo-ficha">
                  {photo ? (
                    <img src={photo} alt={`${vehicle.marca} ${vehicle.modelo}`} className="catalogo-foto" />
                  ) : (
                    <div className="catalogo-foto catalogo-foto-vacia">Sin foto</div>
                  )}
                  <div className="catalogo-cuerpo">
                    <div className="catalogo-titulo">
                      <h2>{vehicle.marca} {vehicle.modelo}</h2>
                      <Plate>{vehicle.patente}</Plate>
                    </div>
                    <dl className="catalogo-datos">
                      <div>
                        <dt>Año</dt>
                        <dd>{dato(vehicle.anio)}</dd>
                      </div>
                      <div>
                        <dt>Kilómetros</dt>
                        <dd>{formatKm(vehicle.kilometraje)}</dd>
                      </div>
                      <div>
                        <dt>Motor</dt>
                        <dd>{dato(vehicle.motor)}</dd>
                      </div>
                      <div>
                        <dt>Transmisión</dt>
                        <dd>{dato(vehicle.transmision)}</dd>
                      </div>
                    </dl>
                    <p className="catalogo-precio">{precioPublico(vehicle)}</p>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <footer className="catalogo-pie">
          Consultas y reservas · {BUSINESS_PHONE} · Instagram @{BUSINESS_IG}
        </footer>
      </article>
    </div>,
    document.body,
  );
}
