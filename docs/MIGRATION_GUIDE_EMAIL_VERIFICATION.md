# Guía de Migración: emailVerificationExpires

## Resumen

Esta migración agrega el campo `email_verification_expires` a la tabla `users` para implementar la expiración de tokens de verificación de email (24 horas).

## Archivos Creados

1. **`migrations/0009_add_email_verification_expires.sql`**
   - Migración SQL que agrega la columna `email_verification_expires`
   - Usa `DO $$ BEGIN ... END $$;` para verificar si la columna ya existe antes de agregarla

2. **`scripts/run-migration.js`**
   - Script genérico para ejecutar migraciones SQL
   - Compatible con PostgreSQL (Supabase, Neon, etc.)

3. **`scripts/verify-database-schema.js`**
   - Script para verificar que el esquema de la base de datos esté correcto
   - Verifica tablas, columnas e índices importantes

## Cómo Ejecutar la Migración

### Opción 1: Usando el script npm (Recomendado)

```bash
npm run db:migrate 0009_add_email_verification_expires.sql
```

### Opción 2: Ejecutar directamente

```bash
node --import dotenv/config scripts/run-migration.js 0009_add_email_verification_expires.sql
```

### Opción 3: Ejecutar SQL manualmente

Si prefieres ejecutar el SQL directamente en tu cliente de base de datos:

1. Abre tu cliente SQL (pgAdmin, DBeaver, Supabase SQL Editor, etc.)
2. Conéctate a tu base de datos
3. Copia y pega el contenido de `migrations/0009_add_email_verification_expires.sql`
4. Ejecuta el SQL

## Verificar la Migración

Después de ejecutar la migración, verifica que se aplicó correctamente:

```bash
npm run db:verify
```

Este script verificará:
- ✅ Que la tabla `users` existe
- ✅ Que todas las columnas requeridas están presentes
- ✅ Que `email_verification_expires` fue agregada correctamente
- ✅ Que las tablas de automatizaciones existen (opcional)

## Verificación Manual

También puedes verificar manualmente ejecutando este SQL:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'email_verification_expires';
```

Deberías ver:
```
column_name                    | data_type  | is_nullable
-------------------------------|------------|------------
email_verification_expires     | timestamp  | YES
```

## Rollback (Si es Necesario)

Si necesitas revertir la migración:

```sql
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_expires;
```

**⚠️ Advertencia:** Esto eliminará todos los datos de expiración. Solo hazlo si es absolutamente necesario.

## Troubleshooting

### Error: "relation 'users' does not exist"
- Asegúrate de que la tabla `users` existe en tu base de datos
- Verifica que estás conectado a la base de datos correcta

### Error: "column already exists"
- Esto es normal si la migración ya fue ejecutada
- El script maneja este caso automáticamente

### Error: "permission denied"
- Verifica que tu usuario de base de datos tiene permisos ALTER TABLE
- En Supabase, asegúrate de usar la conexión de service_role

## Próximos Pasos

Después de aplicar esta migración:

1. ✅ Verifica que la migración se aplicó: `npm run db:verify`
2. ✅ Prueba el flujo de verificación de email
3. ✅ Verifica que los tokens expiran después de 24 horas
4. ✅ Prueba el reenvío de emails de verificación

## Notas

- La columna es nullable (`NULL`) porque los usuarios existentes no tienen tokens de verificación
- Los nuevos usuarios tendrán automáticamente un `email_verification_expires` cuando se registren
- Los tokens expiran después de 24 horas desde su creación

