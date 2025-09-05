# Guía de Migración: Replit → Cursor + Supabase + Vercel

## Resumen de la Migración

Esta aplicación está siendo migrada desde Replit hacia un stack más profesional:
- **IDE**: Replit → Cursor.com
- **Backend**: Replit containers → Vercel serverless
- **Base de datos**: Neon PostgreSQL → Supabase PostgreSQL  
- **Autenticación**: JWT custom → Supabase Auth
- **Storage**: Google Cloud + Replit sidecar → Supabase Storage

## Estado Actual de la Limpieza

✅ **Completado:**
- Referencias de Replit eliminadas del HTML
- URLs de desarrollo cambiadas de replit.dev a localhost
- Creado sistema de storage para Supabase (`server/supabaseStorage.ts`)
- Configurado `.gitignore` para GitHub
- Template de variables de entorno para Supabase (`.env.example`)

🔄 **En progreso:**
- Eliminación del sistema de autenticación de Replit
- Migración de rutas específicas de Replit

⏳ **Pendiente:**
- Configuración de dependencias finales para Supabase
- Migración de esquemas de base de datos
- Configuración para Vercel

## Pasos de Migración

### 1. Preparación en GitHub
```bash
# En tu máquina local con Cursor:
git clone [tu-repo-github]
cd [proyecto]
npm install
```

### 2. Configuración de Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar `.env.example` → `.env`
3. Completar variables de Supabase:
   ```
   SUPABASE_URL=https://[project].supabase.co
   SUPABASE_ANON_KEY=[tu-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[tu-service-key]
   DATABASE_URL=[supabase-postgres-url]
   ```

### 3. Migración de Base de Datos
```bash
# En Cursor, instalar CLI de Supabase
npm install -g supabase

# Aplicar schemas existentes
npx drizzle-kit push
```

### 4. Dependencias a Instalar
```bash
npm install @supabase/supabase-js
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal
```

### 5. Configuración para Vercel
1. Conectar repositorio en [vercel.com](https://vercel.com)
2. Configurar variables de entorno en Vercel dashboard
3. Deploy automático desde GitHub

## Archivos Importantes

### Eliminados/Modificados:
- `server/replitAuth.ts` → Reemplazar con Supabase Auth
- `server/objectStorage.ts` → Reemplazar con `server/supabaseStorage.ts`
- Referencias a REPLIT_SIDECAR_ENDPOINT eliminadas

### Nuevos:
- `server/supabaseStorage.ts` → Sistema de storage para Supabase
- `.env.example` → Template actualizado para Supabase
- `.gitignore` → Configurado para desarrollo profesional

## Beneficios Post-Migración

✨ **Rendimiento:** Vercel Edge vs containers Replit
🔒 **Seguridad:** Supabase Auth enterprise vs JWT casero  
📈 **Escalabilidad:** Serverless vs recursos limitados
💰 **Costo:** Mejor pricing en Supabase/Vercel
🛠️ **Herramientas:** Cursor AI vs editor básico Replit

## Estructura Final

```
proyecto/
├── client/          # Frontend React + TypeScript
├── server/          # Backend Express (para Vercel API routes)
├── shared/          # Schemas compartidos  
├── supabase/        # Configuraciones de Supabase
├── .env.example     # Template variables entorno
├── .gitignore       # Configurado para GitHub
└── vercel.json      # Configuración deployment
```

## Próximos Pasos

1. **Push a GitHub** - Todo el código está listo
2. **Configurar Supabase** - Crear proyecto y obtener keys
3. **Migrar esquemas** - Usar Drizzle para aplicar estructura
4. **Deploy a Vercel** - Conectar repo y configurar variables
5. **Testing** - Verificar funcionalidad completa

**Tiempo estimado:** 2-3 días de trabajo enfocado