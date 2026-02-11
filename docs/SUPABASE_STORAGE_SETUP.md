# 🗄️ Guía de Configuración de Supabase Storage

Esta guía te ayudará a configurar correctamente Supabase Storage para resolver los errores 400 Bad Request.

## 🚨 Problema Identificado

Los errores que estás viendo en los logs:

```
Supabase download error: StorageUnknownError: {}
status: 400,
statusText: 'Bad Request',
```

Ocurren porque:
1. **Los buckets no existen** en Supabase Storage
2. **Las políticas de acceso (RLS)** no están configuradas
3. **Los buckets no son públicos**

## ✅ Solución Rápida

### Paso 1: Ejecutar Script de Configuración

```bash
npm run setup:storage
```

Este script:
- ✅ Verifica la conexión a Supabase
- ✅ Lista los buckets existentes
- ✅ Crea los buckets necesarios si no existen
- ✅ Configura los buckets como públicos
- ✅ Prueba el acceso a cada bucket
- ✅ Muestra instrucciones para configurar políticas de acceso

### Paso 2: Configurar Políticas de Acceso (RLS)

Las políticas de acceso **deben configurarse manualmente** en el Dashboard de Supabase.

#### Opción A: Usar el Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Navega a **Storage** > **Policies**
3. Para cada bucket (`attached-assets`, `lesson-resources`, `post-images`, `profile-images`):
   
   **Crear 4 políticas:**

   **Política 1: Lectura Pública**
   - Nombre: `Public Read Access`
   - Allowed operations: `SELECT`
   - Target roles: `public`
   - Policy definition: `true`

   **Política 2: Subida Autenticada**
   - Nombre: `Authenticated Upload`
   - Allowed operations: `INSERT`
   - Target roles: `authenticated`
   - Policy definition: `true`

   **Política 3: Actualización Autenticada**
   - Nombre: `Authenticated Update`
   - Allowed operations: `UPDATE`
   - Target roles: `authenticated`
   - Policy definition: `true`

   **Política 4: Eliminación Autenticada**
   - Nombre: `Authenticated Delete`
   - Allowed operations: `DELETE`
   - Target roles: `authenticated`
   - Policy definition: `true`

#### Opción B: Usar SQL (Más Rápido)

1. Ve a **SQL Editor** en Supabase Dashboard
2. Ejecuta este SQL:

```sql
-- Políticas para attached-assets
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'attached-assets');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attached-assets');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'attached-assets');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'attached-assets');

-- Políticas para lesson-resources
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'lesson-resources');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lesson-resources');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'lesson-resources');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'lesson-resources');

-- Políticas para post-images
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'post-images');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-images');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'post-images');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'post-images');

-- Políticas para profile-images
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'profile-images');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-images');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-images');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-images');
```

### Paso 3: Verificar Configuración

Después de configurar las políticas, reinicia el servidor:

```bash
npm run dev
```

Verifica los logs. Deberías ver:
- ✅ `Archivo descargado exitosamente de Supabase`
- ✅ `Archivo servido exitosamente`

En lugar de:
- ❌ `Supabase download error: StorageUnknownError`

## 📦 Buckets Configurados

| Bucket | Público | Tamaño Máx | Tipos Permitidos |
|--------|---------|------------|------------------|
| `attached-assets` | ✅ Sí | 50 MB | Todos |
| `lesson-resources` | ✅ Sí | 50 MB | Todos |
| `post-images` | ✅ Sí | 10 MB | Imágenes |
| `profile-images` | ✅ Sí | 5 MB | Imágenes |

## 🔍 Debugging

### Ver Logs Detallados

Los logs ahora incluyen información detallada:

```
📥 Descargando desde Supabase Storage: {
  bucket: 'attached-assets',
  normalizedPath: 'uploads/cf024f9e-27d5-48a7-ad06-637c25ff2f53',
  originalPath: 'private/uploads/cf024f9e-27d5-48a7-ad06-637c25ff2f53'
}
```

### Verificar Buckets Manualmente

1. Ve a **Storage** en Supabase Dashboard
2. Verifica que los 4 buckets existen
3. Haz clic en cada bucket para ver archivos
4. Intenta subir un archivo de prueba

### Verificar Políticas

1. Ve a **Storage** > **Policies**
2. Cada bucket debe tener 4 políticas
3. Las políticas deben estar **habilitadas** (toggle verde)

## 🐛 Solución de Problemas Comunes

### Error: "Bucket does not exist"

**Solución**: Ejecuta `npm run setup:storage` para crear los buckets.

### Error: "new row violates row-level security policy"

**Solución**: Las políticas de RLS no están configuradas. Sigue el Paso 2 arriba.

### Error: "Invalid bucket name"

**Solución**: Verifica que estás usando los nombres correctos:
- `attached-assets` (con guión, no underscore)
- `lesson-resources`
- `post-images`
- `profile-images`

### Error: "Permission denied"

**Solución**: 
1. Verifica que usas `SUPABASE_SERVICE_ROLE_KEY` (no `SUPABASE_ANON_KEY`)
2. Verifica que la key es correcta en `.env`

### Los archivos siguen fallando

**Solución**: 
1. Verifica que los archivos existen en Supabase Storage
2. Si migraste desde local, ejecuta el script de migración:
   ```bash
   npx tsx scripts/migrate-to-supabase.ts
   ```

## 📊 Mejoras Implementadas

### 1. Logging Mejorado

Ahora verás logs detallados en la consola:
- 📥 Al descargar archivos
- 🔗 Al generar URLs públicas
- 📤 Al servir archivos
- ✅ Confirmaciones de éxito
- ❌ Errores con contexto

### 2. Manejo de Errores Mejorado

Los errores ahora incluyen:
- Código de estado HTTP
- Mensaje de error detallado
- Bucket y ruta del archivo
- Sugerencias de solución

### 3. Fallback a Almacenamiento Local

Si Supabase Storage falla, el sistema automáticamente intenta:
1. Servir desde almacenamiento local
2. Log del error
3. Continuar funcionando

## 🎯 Próximos Pasos

Una vez configurado Supabase Storage:

1. **Migrar archivos existentes**:
   ```bash
   npx tsx scripts/migrate-all-to-supabase.ts
   ```

2. **Limpiar archivos locales** (opcional, después de verificar):
   ```bash
   rm -rf attached_assets/
   rm -rf private/
   ```

3. **Deshabilitar logging verbose** (en producción):
   En `supabaseStorage.ts`, comenta los `console.log` si no los necesitas.

## 📞 Soporte

Si sigues teniendo problemas:

1. Verifica las variables de entorno:
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. Verifica la conexión a Supabase:
   ```bash
   npm run setup:storage
   ```

3. Revisa los logs del servidor en tiempo real

4. Consulta la documentación oficial: https://supabase.com/docs/guides/storage

---

**¡Configuración completada! 🎉**

Ahora tu aplicación debería poder subir, descargar y servir archivos desde Supabase Storage sin errores.

