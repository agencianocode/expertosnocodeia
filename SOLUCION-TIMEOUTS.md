# 🔧 Solución a Problemas de Timeout y Conexiones

## ✅ Cambios Aplicados

### 1. **Configuración del Pool de Conexiones Mejorada** (`server/db.ts`)

**Cambios realizados:**
- ✅ Aumentado `max` de 20 a 30 conexiones
- ✅ Agregado `min: 5` para mantener conexiones activas
- ✅ Aumentado `connectionTimeoutMillis` de 10s a 30s
- ✅ Agregado `statement_timeout: 30000` (30 segundos)
- ✅ Agregado `query_timeout: 30000` (30 segundos)
- ✅ Habilitado `keepAlive` para mantener conexiones vivas

**Razón:** Supabase pooler puede tener latencia variable, especialmente en desarrollo. Los timeouts más largos y más conexiones previenen agotamiento del pool.

---

## ⚠️ Problemas Detectados

### 1. **Timeouts de Conexión a Base de Datos**

**Síntoma:**
```
Error: timeout exceeded when trying to connect
```

**Causa:**
- El pool de conexiones se agotaba con muchas consultas simultáneas
- Timeout de conexión muy corto (10 segundos)

**Solución aplicada:**
- ✅ Pool aumentado a 30 conexiones
- ✅ Timeout aumentado a 30 segundos
- ✅ Conexiones mínimas mantenidas activas

**Si persiste:**
1. Verificar que `DATABASE_URL` use el **pooler** de Supabase (no la conexión directa)
2. Verificar que no haya consultas bloqueantes
3. Considerar usar connection pooling de Supabase directamente

---

### 2. **Archivos No Encontrados en Supabase Storage**

**Síntoma:**
```
❌ Error descargando archivo de Supabase: { error: '{}' }
✅ Archivo servido desde local (fallback)
```

**Causa:**
- Los archivos están en `attached_assets/private/uploads/` localmente
- No han sido migrados a Supabase Storage
- El sistema tiene fallback a local (funciona, pero no es ideal)

**Estado actual:**
- ✅ El sistema funciona con fallback a local
- ⚠️ Los archivos no están en Supabase Storage

**Solución (opcional):**
Si quieres migrar los archivos a Supabase Storage:

1. **Verificar buckets en Supabase:**
   - Ir a Supabase Dashboard > Storage
   - Verificar que exista el bucket `attached-assets`
   - Verificar políticas de acceso (público/privado según corresponda)

2. **Migrar archivos (si es necesario):**
   ```bash
   # Ejecutar script de migración (si existe)
   npm run migrate:storage
   ```

3. **O mantener fallback local:**
   - El sistema funciona bien con fallback local
   - Solo asegúrate de que `attached_assets/` esté en el servidor

---

## 🔍 Verificaciones Adicionales

### Verificar Pool de Conexiones

El pool ahora tiene:
- **Máximo:** 30 conexiones
- **Mínimo:** 5 conexiones activas
- **Timeout de conexión:** 30 segundos
- **Timeout de consulta:** 30 segundos

### Verificar DATABASE_URL

Asegúrate de que uses el **pooler** de Supabase:

```env
# ✅ CORRECTO (pooler)
DATABASE_URL=postgresql://postgres.ehmihfufuufthefwrnrb:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# ❌ INCORRECTO (conexión directa - puede causar problemas)
DATABASE_URL=postgresql://postgres.ehmihfufuufthefwrnrb:[PASSWORD]@db.ehmihfufuufthefwrnrb.supabase.co:5432/postgres
```

---

## 📊 Monitoreo

### Logs a Observar

1. **Conexiones exitosas:**
   ```
   ✅ Conexión a la base de datos establecida
   ```

2. **Errores de pool:**
   ```
   ❌ Error en el pool de conexiones: ...
   ```

3. **Timeouts:**
   ```
   Error: timeout exceeded when trying to connect
   ```

### Si Persisten los Problemas

1. **Reducir carga simultánea:**
   - Limitar número de consultas paralelas
   - Implementar rate limiting

2. **Usar Supabase Connection Pooler directamente:**
   - Considerar usar `@supabase/supabase-js` para queries directas
   - O usar Supabase REST API para operaciones simples

3. **Optimizar consultas:**
   - Revisar consultas que toman mucho tiempo
   - Agregar índices si es necesario
   - Usar `EXPLAIN ANALYZE` para identificar cuellos de botella

---

## ✅ Estado Actual

- ✅ Pool de conexiones optimizado
- ✅ Timeouts aumentados
- ✅ Fallback a archivos locales funcionando
- ⚠️ Archivos no migrados a Supabase Storage (opcional)

**El sistema debería funcionar mejor ahora. Si los timeouts persisten, puede ser un problema de red o de carga en Supabase.**

---

**Fecha:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

