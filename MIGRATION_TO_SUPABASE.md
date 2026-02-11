# 🚀 Guía Completa de Migración a Supabase

Esta guía te ayudará a migrar completamente tu aplicación de almacenamiento local y Neon a Supabase.

## 📋 Prerrequisitos

1. Cuenta en [Supabase](https://supabase.com)
2. Node.js y npm instalados
3. Acceso a tu base de datos actual (Neon)
4. Backup de todos los datos importantes

## 🔧 Paso 1: Configurar Supabase

### 1.1 Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Haz clic en "New Project"
3. Completa el formulario:
   - **Name**: Nombre de tu proyecto
   - **Database Password**: Crea una contraseña segura (guárdala)
   - **Region**: Elige la región más cercana
4. Espera a que se cree el proyecto (2-3 minutos)

### 1.2 Obtener Credenciales

1. Ve a **Settings** > **API**
2. Copia las siguientes credenciales:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

3. Ve a **Settings** > **Database**
4. Copia la **Connection string** (URI) → `DATABASE_URL`

### 1.3 Configurar Variables de Entorno

Crea o actualiza tu archivo `.env` en la raíz del proyecto:

```env
# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[TU_PASSWORD]@db.tu-proyecto.supabase.co:5432/postgres

# Guardar la URL antigua para migración
OLD_DATABASE_URL=postgresql://neon_old_url...
```

## 📦 Paso 2: Crear Buckets en Supabase Storage

1. Ve a **Storage** en el dashboard de Supabase
2. Crea los siguientes buckets (haz clic en "New bucket"):

   **Bucket 1: `lesson-resources`**
   - Public: ✅ Sí
   - File size limit: 50 MB
   - Allowed MIME types: (dejar vacío para permitir todos)

   **Bucket 2: `post-images`**
   - Public: ✅ Sí
   - File size limit: 10 MB
   - Allowed MIME types: `image/*`

   **Bucket 3: `attached-assets`**
   - Public: ✅ Sí
   - File size limit: 50 MB
   - Allowed MIME types: (dejar vacío)

   **Bucket 4: `profile-images`**
   - Public: ✅ Sí
   - File size limit: 5 MB
   - Allowed MIME types: `image/*`

## 🗄️ Paso 3: Migrar Base de Datos

### Opción A: Usar pg_dump (Recomendado)

```bash
# 1. Exportar datos de Neon
pg_dump "tu_neon_database_url" > backup.sql

# 2. Importar a Supabase
psql "tu_supabase_database_url" < backup.sql
```

### Opción B: Usar Drizzle Migrations

Si ya tienes migraciones de Drizzle:

```bash
# 1. Actualizar DATABASE_URL en .env con Supabase
# 2. Ejecutar migraciones
npm run db:push
```

### Opción C: Migración Manual

1. Exporta cada tabla desde Neon
2. Importa a Supabase usando el SQL Editor
3. Verifica que todas las tablas se crearon correctamente

## 📁 Paso 4: Migrar Archivos a Supabase Storage

### 4.1 Instalar Dependencias

```bash
npm install pg @supabase/supabase-js
```

### 4.2 Ejecutar Script de Migración

```bash
npx tsx scripts/migrate-to-supabase.ts
```

Este script:
- ✅ Crea los buckets necesarios
- ✅ Migra todos los archivos de `attached_assets/` a Supabase Storage
- ✅ Actualiza las URLs en la base de datos

### 4.3 Verificar Migración

1. Ve a **Storage** en Supabase
2. Verifica que los buckets tienen archivos
3. Prueba acceder a algunas URLs públicas

## 🔄 Paso 5: Actualizar Código

El código ya ha sido actualizado para usar Supabase Storage. Solo necesitas:

1. **Reiniciar el servidor**:
   ```bash
   npm run dev
   ```

2. **Verificar que funciona**:
   - Sube una imagen nueva
   - Verifica que se guarda en Supabase Storage
   - Verifica que las URLs son de Supabase

## ✅ Paso 6: Verificación Final

### 6.1 Verificar Base de Datos

```bash
# Conectarte a Supabase desde terminal
psql "tu_supabase_database_url"

# Verificar tablas
\dt

# Verificar datos
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM courses;
```

### 6.2 Verificar Storage

1. Ve a **Storage** > **Buckets**
2. Verifica que todos los buckets tienen archivos
3. Haz clic en un archivo y verifica que la URL pública funciona

### 6.3 Probar Funcionalidades

- ✅ Subir una imagen de perfil
- ✅ Subir un recurso de lección
- ✅ Crear un post con imagen
- ✅ Verificar que las imágenes se muestran correctamente

## 🚨 Solución de Problemas

### Error: "Supabase no configurado"

**Solución**: Verifica que las variables de entorno están configuradas:
```bash
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Error: "Bucket no existe"

**Solución**: Crea los buckets manualmente en el dashboard de Supabase

### Error: "Archivo no encontrado"

**Solución**: 
1. Verifica que el archivo existe en Supabase Storage
2. Verifica que el bucket es público
3. Revisa los logs del servidor

### Error de conexión a la base de datos

**Solución**:
1. Verifica que `DATABASE_URL` apunta a Supabase
2. Verifica que la contraseña es correcta
3. Verifica que el SSL está configurado (Supabase requiere SSL)

## 📝 Notas Importantes

1. **Backup**: Siempre haz backup antes de migrar
2. **Pruebas**: Prueba en un entorno de desarrollo primero
3. **URLs**: Las URLs antiguas seguirán funcionando durante la migración (fallback a local)
4. **Performance**: Supabase Storage es muy rápido, pero las primeras cargas pueden ser lentas

## 🎯 Próximos Pasos

Después de la migración:

1. ✅ Eliminar código de ObjectStorage (opcional, después de verificar)
2. ✅ Eliminar carpeta `attached_assets` (después de verificar que todo funciona)
3. ✅ Actualizar documentación
4. ✅ Configurar CDN si es necesario (Supabase ya incluye CDN)

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica las variables de entorno
3. Consulta la documentación de Supabase: https://supabase.com/docs

---

**¡Migración completada! 🎉**

Ahora todo está en Supabase:
- ✅ Base de datos PostgreSQL
- ✅ Almacenamiento de archivos
- ✅ Autenticación (ya estaba configurada)

