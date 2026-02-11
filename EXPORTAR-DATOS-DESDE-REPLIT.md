# 📤 Exportar Datos desde Replit

## 🎯 Objetivo
Exportar todos los datos de Neon a un archivo SQL para importarlos luego en Supabase.

## 📋 Pasos desde Replit

### Opción 1: Usar la Terminal de Replit (Recomendado)

1. **Abre la terminal en Replit** (pestaña "Shell" o ">_ Console")

2. **Verifica que tienes acceso a Neon**:
   ```bash
   echo $DATABASE_URL
   ```
   Debería mostrar la URL de Neon.

3. **Exporta los datos usando pg_dump**:
   ```bash
   pg_dump "$DATABASE_URL" > backup-completo.sql
   ```
   
   O si pg_dump no está disponible, usa:
   ```bash
   PGPASSWORD="tu_password" pg_dump -h ep-bitter-shape-afy5xfhi.c-2.us-west-2.aws.neon.tech -U neondb_owner -d neondb > backup-completo.sql
   ```

4. **Verifica que el archivo se creó**:
   ```bash
   ls -lh backup-completo.sql
   ```

5. **Descarga el archivo**:
   - Haz clic derecho en `backup-completo.sql` en el explorador de archivos
   - Selecciona "Download"

### Opción 2: Usar el SQL Editor de Neon (si tienes acceso)

1. Ve a https://console.neon.tech
2. Selecciona tu proyecto
3. Ve a "SQL Editor"
4. Ejecuta queries para exportar cada tabla manualmente

### Opción 3: Usar un Script Node.js en Replit

Crea un archivo `export-data.js` en Replit:

```javascript
const { exec } = require('child_process');
const fs = require('fs');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL no está configurada');
  process.exit(1);
}

console.log('🔄 Exportando datos de Neon...');

exec(`pg_dump "${dbUrl}" > backup-completo.sql`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (fs.existsSync('backup-completo.sql')) {
    const stats = fs.statSync('backup-completo.sql');
    console.log(`✅ Backup creado: backup-completo.sql (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log('📥 Descarga el archivo desde el explorador de archivos');
  } else {
    console.error('❌ El archivo no se creó');
  }
});
```

Luego ejecuta:
```bash
node export-data.js
```

## 📥 Después de Exportar

Una vez que tengas el archivo `backup-completo.sql`:

1. **Descárgalo** desde Replit
2. **Importa a Supabase**:
   - Ve al SQL Editor de Supabase
   - Pega el contenido del archivo
   - O usa: `node import-sql-backup.cjs backup-completo.sql`

## ⚠️ Nota Importante

Si Neon está suspendido en Replit también, necesitarás:
1. Reactivar Neon desde https://console.neon.tech
2. Luego exportar los datos

