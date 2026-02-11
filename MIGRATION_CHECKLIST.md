# ✅ Checklist de Migración a Supabase

## 📋 Pre-Migración

- [ ] Crear proyecto en Supabase
- [ ] Obtener todas las credenciales (URL, ANON_KEY, SERVICE_ROLE_KEY, DATABASE_URL)
- [ ] Hacer backup completo de la base de datos actual
- [ ] Hacer backup de la carpeta `attached_assets/`

## 🔧 Configuración

- [ ] Actualizar archivo `.env` con las credenciales de Supabase
- [ ] Crear buckets en Supabase Storage:
  - [ ] `lesson-resources` (público)
  - [ ] `post-images` (público)
  - [ ] `attached-assets` (público)
  - [ ] `profile-images` (público)

## 🗄️ Migración de Base de Datos

- [ ] Exportar datos de Neon (usar pg_dump)
- [ ] Importar datos a Supabase (usar psql o SQL Editor)
- [ ] Verificar que todas las tablas se crearon
- [ ] Verificar que los datos se importaron correctamente
- [ ] Actualizar `DATABASE_URL` en `.env` con la connection string de Supabase

## 📁 Migración de Archivos

- [ ] Ejecutar script de migración: `npx tsx scripts/migrate-to-supabase.ts`
- [ ] Verificar que los archivos se subieron a Supabase Storage
- [ ] Verificar que las URLs se actualizaron en la base de datos

## 🧪 Pruebas

- [ ] Reiniciar el servidor: `npm run dev`
- [ ] Probar subir una imagen de perfil
- [ ] Probar subir un recurso de lección
- [ ] Probar crear un post con imagen
- [ ] Verificar que las imágenes se muestran correctamente
- [ ] Verificar que los archivos antiguos aún funcionan (fallback)

## ✅ Post-Migración

- [ ] Verificar logs del servidor (no debe haber errores)
- [ ] Probar todas las funcionalidades principales
- [ ] Verificar rendimiento (debe ser igual o mejor)
- [ ] Documentar cualquier problema encontrado

## 🗑️ Limpieza (Opcional, después de verificar)

- [ ] Eliminar carpeta `attached_assets/` (solo después de confirmar que todo funciona)
- [ ] Eliminar código de ObjectStorage (opcional)
- [ ] Eliminar código de LocalFileStorage (opcional)

---

## 🚨 Si algo sale mal

1. **Revertir DATABASE_URL** en `.env` a la URL anterior
2. **Reiniciar el servidor**
3. **Revisar logs** para identificar el problema
4. **Consultar la guía** `MIGRATION_TO_SUPABASE.md`

