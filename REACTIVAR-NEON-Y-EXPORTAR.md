# 🔄 Reactivar Neon y Exportar Datos

## ⚠️ Situación Actual

Neon está **suspendido**, por eso el error: "The endpoint has been disabled"

## 🎯 Solución: Reactivar Neon Temporalmente

### Paso 1: Reactivar Neon

1. **Ve a https://console.neon.tech**
2. **Inicia sesión** con tu cuenta
3. **Busca tu proyecto** (el que tiene la URL `ep-bitter-shape-afy5xfhi...`)
4. **Haz clic en "Resume" o "Restore"** para reactivar el proyecto
5. **Espera 1-2 minutos** a que se reactive completamente

### Paso 2: Exportar desde Replit

Una vez que Neon esté reactivado:

1. **En la terminal de Replit**, ejecuta:
   ```bash
   pg_dump "$DATABASE_URL" > backup-completo-replit.sql
   ```

2. **Espera a que termine** (puede tardar varios minutos dependiendo del tamaño)

3. **Verifica que el archivo se creó**:
   ```bash
   ls -lh backup-completo-replit.sql
   ```

4. **Descarga el archivo**:
   - En el explorador de archivos de Replit (lado derecho)
   - Busca `backup-completo-replit.sql`
   - Clic derecho → "Download"

### Paso 3: Importar a Supabase

Una vez descargado el archivo:

1. **Copia el archivo** a tu máquina local (donde tienes Cursor)

2. **Importa a Supabase**:
   ```bash
   node import-sql-backup.cjs backup-completo-replit.sql
   ```

   O manualmente:
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto
   - Ve a **SQL Editor**
   - Pega el contenido del archivo SQL
   - Haz clic en **"Run"**

## ⏱️ Tiempo Estimado

- Reactivar Neon: 1-2 minutos
- Exportar datos: 2-10 minutos (depende del tamaño)
- Importar a Supabase: 5-15 minutos

## 💡 Importante

- **No suspendas Neon** hasta que hayas descargado el backup
- El archivo SQL puede ser grande (varios MB)
- Asegúrate de tener espacio en disco en Replit

## ✅ Después de Migrar

Una vez importado en Supabase:
1. Verifica los datos: `node check-supabase-data.cjs`
2. Reinicia el servidor: `npm run dev`
3. Prueba que todo funcione
4. **Luego puedes suspender Neon nuevamente**

