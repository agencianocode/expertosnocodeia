# 📦 Guía para Migrar Datos de Neon a Supabase

## ⚠️ Situación Actual

Neon está suspendido, por lo que no podemos exportar los datos directamente. Aquí tienes las opciones:

## 🔄 Opción 1: Reactivar Neon Temporalmente (Recomendado)

1. **Ve a tu dashboard de Neon**: https://console.neon.tech
2. **Reactiva el proyecto** temporalmente
3. **Ejecuta el script de migración**:
   ```bash
   node migrate-data-neon-to-supabase.cjs
   ```
4. **Después de migrar**, puedes suspender Neon nuevamente

## 📥 Opción 2: Si Tienes un Backup SQL

Si tienes un archivo `.sql` con un backup de Neon:

1. **Ve al SQL Editor de Supabase**:
   - Dashboard de Supabase → SQL Editor
   
2. **Importa el backup**:
   - Pega el contenido del archivo SQL
   - Haz clic en "Run"
   
3. **O usa psql desde terminal**:
   ```bash
   psql "tu_supabase_database_url" < backup.sql
   ```

## 🔧 Opción 3: Exportar Manualmente desde Neon (si lo reactivas)

Si reactivas Neon, puedes exportar usando `pg_dump`:

```bash
# Exportar todo
pg_dump "postgresql://neondb_owner:npg_VC4WTlngEUK1@ep-bitter-shape-afy5xfhi.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require" > backup.sql

# Importar a Supabase
psql "postgresql://postgres.ehmihfufuufthefwrnrb:hVAO76QvnVkjcyXi@aws-1-us-east-2.pooler.supabase.com:5432/postgres" < backup.sql
```

## 📋 Opción 4: Migración Manual Tabla por Tabla

Si prefieres migrar manualmente, puedes usar el SQL Editor de Supabase:

1. **Ve a SQL Editor en Supabase**
2. **Para cada tabla**, ejecuta algo como:

```sql
-- Ejemplo: Insertar usuarios
INSERT INTO users (id, email, "firstName", "lastName", ...)
SELECT id, email, "firstName", "lastName", ...
FROM neon_database.users
ON CONFLICT (id) DO NOTHING;
```

## 🚀 Opción 5: Usar el Script de Migración (cuando reactives Neon)

Una vez que reactives Neon, el script `migrate-data-neon-to-supabase.cjs` migrará automáticamente todas las tablas.

## ✅ Verificación Después de Migrar

Después de migrar los datos, verifica:

```bash
# Probar conexión
node test-db-connection.js

# Reiniciar servidor
npm run dev
```

## 💡 Recomendación

**La forma más rápida es reactivar Neon temporalmente** y ejecutar el script de migración. Solo tomará unos minutos y luego puedes suspenderlo nuevamente.

