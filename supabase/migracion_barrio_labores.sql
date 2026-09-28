-- ============================================================
-- MIGRACIÓN: barrio y comuna · Micrófono (antes Testimonio) · sin Fundas
-- Ejecutar UNA sola vez en Supabase → SQL Editor → Run
-- Es seguro volver a ejecutarla. No borra tablas ni colaboradores.
-- ============================================================

-- 1. Barrio y comuna del lugar de residencia
ALTER TABLE colaboradores
  ADD COLUMN IF NOT EXISTS barrio TEXT,
  ADD COLUMN IF NOT EXISTS comuna TEXT;

-- 2. Desactivar temporalmente la marca automática mientras se ajustan las labores
DROP TRIGGER IF EXISTS trg_datos_actualizados ON colaboradores;

-- 3. "Testimonio" es lo mismo que "Micrófono": se unifica en Micrófono (conservando la fecha "desde")
UPDATE colaboradores
SET labores = (
      SELECT COALESCE(jsonb_agg(DISTINCT CASE WHEN e = 'Testimonio' THEN 'Micrófono' ELSE e END), '[]'::jsonb)
      FROM jsonb_array_elements_text(labores) AS e
    ),
    fechas_labores = CASE
      WHEN COALESCE(fechas_labores, '{}'::jsonb) ? 'Testimonio'
        THEN (fechas_labores - 'Testimonio')
             || CASE WHEN fechas_labores ? 'Micrófono' THEN '{}'::jsonb
                     ELSE jsonb_build_object('Micrófono', fechas_labores -> 'Testimonio') END
      ELSE fechas_labores END
WHERE labores @> '["Testimonio"]'::jsonb;

-- 4. Quitar "Fundas" de las labores (queda anotado en observaciones para no perder el dato)
UPDATE colaboradores
SET observaciones = TRIM(BOTH '; ' FROM CONCAT_WS('; ', NULLIF(observaciones, ''), 'Labor anterior: Fundas'))
WHERE labores @> '["Fundas"]'::jsonb
  AND COALESCE(observaciones, '') NOT LIKE '%Labor anterior: Fundas%';

UPDATE colaboradores
SET labores = labores - 'Fundas',
    fechas_labores = COALESCE(fechas_labores, '{}'::jsonb) - 'Fundas'
WHERE labores @> '["Fundas"]'::jsonb;

-- 5. Marca automática de "datos actualizados" (igual que antes + barrio y comuna,
--    que no existen en el CEMP y por eso no deben poner la ficha como "Desactualizada")
CREATE OR REPLACE FUNCTION tocar_datos_actualizados() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  ignorar TEXT[] := ARRAY[
    'cemp_fecha_registro','cemp_registrado_por','datos_actualizados_en',
    'activo','mira','fimlm','dia_profecia','horario','observaciones',
    'creado_en','consentimiento_datos','consentimiento_fecha',
    'barrio','comuna'
  ];
BEGIN
  IF NEW.cemp_fecha_registro IS DISTINCT FROM OLD.cemp_fecha_registro THEN
    RETURN NEW;
  END IF;
  IF (to_jsonb(NEW) - ignorar) IS DISTINCT FROM (to_jsonb(OLD) - ignorar) THEN
    NEW.datos_actualizados_en := NOW();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_datos_actualizados ON colaboradores;
CREATE TRIGGER trg_datos_actualizados
  BEFORE UPDATE ON colaboradores
  FOR EACH ROW EXECUTE FUNCTION tocar_datos_actualizados();

-- Verificación: las dos últimas columnas deben dar 0
SELECT COUNT(*) FILTER (WHERE barrio IS NOT NULL OR comuna IS NOT NULL) AS con_barrio_o_comuna,
       COUNT(*) FILTER (WHERE labores @> '["Micrófono"]'::jsonb)       AS con_microfono,
       COUNT(*) FILTER (WHERE labores @> '["Testimonio"]'::jsonb)      AS con_testimonio,
       COUNT(*) FILTER (WHERE labores @> '["Fundas"]'::jsonb)          AS con_fundas
FROM colaboradores;
