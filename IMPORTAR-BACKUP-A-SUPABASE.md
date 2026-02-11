# 📥 Importar Backup a Supabase

## ✅ Paso 1: Copiar el Archivo

1. **Copia el archivo** `backup-completo-replit.sql` desde tu carpeta de Descargas a:
   ```
   C:\expertosnocodeia\backup-completo-replit.sql
   ```

## 📥 Paso 2: Importar a Supabase

Tienes **2 opciones**:

### Opción A: Usando el Script (Recomendado)

```bash
node import-sql-backup.cjs backup-completo-replit.sql
```

**Nota**: Si `psql` no está instalado, usa la Opción B.

### Opción B: Usando el SQL Editor de Supabase (Más Fácil)

1. **Abre** https://supabase.com/dashboard
2. **Selecciona** tu proyecto
3. **Ve a** "SQL Editor" (en el menú lateral)
4. **Abre** el archivo `backup-completo-replit.sql` en un editor de texto
5. **Copia TODO el contenido** del archivo
6. **Pega** en el SQL Editor de Supabase
7. **Haz clic** en "Run" (o presiona Ctrl+Enter)

## ✅ Paso 3: Verificar que se Importó

Ejecuta:

```bash
node check-supabase-data.cjs
```

Esto te mostrará cuántas filas hay en cada tabla.

## 🔄 Paso 4: Reiniciar el Servidor

```bash
npm run dev
```

Y verifica que la aplicación carga los datos correctamente.

---

## ⚠️ Si Hay Errores

### Error: "relation already exists"
- **Solución**: El esquema ya existe. Solo necesitas importar los datos.
- **Acción**: Comenta las líneas `CREATE TABLE` en el SQL y solo ejecuta los `INSERT`.

### Error: "duplicate key value"
- **Solución**: Ya hay datos en Supabase.
- **Acción**: Limpia las tablas primero o ajusta el SQL para usar `INSERT ... ON CONFLICT`.

### Error: "psql no está instalado"
- **Solución**: Usa la Opción B (SQL Editor de Supabase).

---

## 📋 Resumen de Comandos

```bash
# 1. Verificar que el archivo está en el directorio
dir backup-completo-replit.sql

# 2. Importar (si tienes psql)
node import-sql-backup.cjs backup-completo-replit.sql

# 3. Verificar datos
node check-supabase-data.cjs

# 4. Reiniciar servidor
npm run dev
```

