# 📥 Instrucciones para Importar a Supabase

## ⚠️ IMPORTANTE: Usa el Archivo Limpio

**NO uses** `backup-completo-replit.sql` (el original)
**USA** `backup-completo-replit-limpiado.sql` (el limpio)

## 📋 Pasos Detallados

### 1. Abre el Archivo Limpio

1. En Cursor, abre el archivo: `backup-completo-replit-limpiado.sql`
2. **NO copies** desde el archivo original `backup-completo-replit.sql`

### 2. Copia TODO el Contenido

1. Presiona `Ctrl+A` para seleccionar todo
2. Presiona `Ctrl+C` para copiar
3. **Asegúrate** de copiar desde el inicio del archivo (no desde el medio)

### 3. Ve al SQL Editor de Supabase

1. Abre https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **"SQL Editor"** (en el menú lateral izquierdo)
4. Haz clic en **"New query"** o usa el editor existente

### 4. Pega y Ejecuta

1. **Borra** cualquier contenido que haya en el editor
2. Presiona `Ctrl+V` para pegar
3. **Verifica** que el contenido empiece con `--` o `CREATE` (NO con `#` o `\`)
4. Haz clic en **"Run"** (o presiona `Ctrl+Enter`)

## ⚠️ Si Ves Errores

### Error: "syntax error at or near #"
- **Causa**: Estás usando el archivo incorrecto o copiaste desde el lugar equivocado
- **Solución**: Asegúrate de usar `backup-completo-replit-limpiado.sql` y copiar desde el inicio

### Error: "relation already exists"
- **Causa**: Las tablas ya existen en Supabase
- **Solución**: Esto es normal si ya ejecutaste `npm run db:push`. Solo necesitas los datos (INSERT), no el esquema (CREATE TABLE)

### Error: "permission denied" o "owner"
- **Causa**: Comandos de OWNER que Supabase no permite
- **Solución**: El script de limpieza debería haberlos eliminado. Si persiste, ejecuta el script de limpieza nuevamente

## 🔄 Alternativa: Importar Solo los Datos

Si el esquema ya existe (porque ejecutaste `npm run db:push`), puedes:

1. **Abrir** `backup-completo-replit-limpiado.sql`
2. **Buscar** todas las líneas que empiezan con `CREATE` o `ALTER` y comentarlas o eliminarlas
3. **Dejar solo** las líneas `INSERT INTO ...`
4. **Copiar y pegar** solo esas líneas en Supabase

## ✅ Verificar que Funcionó

Después de importar, ejecuta:

```bash
node check-supabase-data.cjs
```

Esto te mostrará cuántas filas hay en cada tabla.

