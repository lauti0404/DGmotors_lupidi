-- Precios e ítems de detailing, extras y membresías.
-- Lo edita el admin y lo leen todos los empleados.

CREATE TABLE IF NOT EXISTS public.catalogo_servicios (
    id UUID PRIMARY KEY,
    clave TEXT NOT NULL UNIQUE,
    grupo TEXT NOT NULL CHECK (grupo IN ('detailing', 'extra', 'membresia')),
    nombre TEXT NOT NULL,
    subtitulo TEXT,
    precio NUMERIC NOT NULL DEFAULT 0,
    moneda TEXT NOT NULL DEFAULT 'ARS',
    incluye TEXT NOT NULL DEFAULT '',
    usos INTEGER NOT NULL DEFAULT 0,
    orden INTEGER NOT NULL DEFAULT 1,
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.catalogo_servicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total autenticados en catalogo_servicios" ON public.catalogo_servicios;
CREATE POLICY "Acceso total autenticados en catalogo_servicios"
    ON public.catalogo_servicios FOR ALL TO authenticated USING (true) WITH CHECK (true);
