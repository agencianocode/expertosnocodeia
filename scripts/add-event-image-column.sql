-- Agregar columna eventImage a la tabla live_events
ALTER TABLE live_events 
ADD COLUMN IF NOT EXISTS event_image VARCHAR;

-- Actualizar eventos existentes con imagen por defecto (opcional)
-- UPDATE live_events SET event_image = NULL WHERE event_image IS NULL;

-- Confirmar la columna fue agregada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'live_events' AND column_name = 'event_image';

