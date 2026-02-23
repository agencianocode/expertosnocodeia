# Expertos NoCode IA - Ecosistema Educativo

Sistema educativo completo de NoCode con tres componentes principales:

## 🏗️ Arquitectura del Proyecto

- **Landing Principal** (expertosnocodeia.com) - Contenido público y herramientas
- **Universidad NoCode** (expertosnocodeia.com/universidad-nocode-ia) - Catálogo de cursos
- **LMS Application** (app.expertosnocodeia.com) - Sistema de aprendizaje completo

## 🚀 Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Vite** para desarrollo y build
- **Tailwind CSS** + shadcn/ui components
- **Wouter** para routing
- **TanStack Query** para state management

### Backend
- **Express.js** con TypeScript
- **Drizzle ORM** + PostgreSQL
- **Supabase** para auth y storage
- **Express sessions** para gestión de estado

### Deployment
- **Vercel** para hosting
- **Supabase PostgreSQL** para base de datos
- **Supabase Storage** para archivos

## 📦 Instalación

```bash
# Clonar repositorio
git clone [tu-repo-url]
cd expertos-nocode-ia

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Completar variables en .env

# Aplicar schema de base de datos
npm run db:push

# Iniciar desarrollo
npm run dev
```

## 🔧 Variables de Entorno

Ver `.env.example` para la lista completa. En producción (Railway) configurar las variables en el panel de Railway; no subir `.env` al repo.

**Checklist de despliegue (Railway, Stripe, Google OAuth):** ver [docs/DEPLOY-RAILWAY.md](docs/DEPLOY-RAILWAY.md).

```env
# Supabase
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Database
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/[database]

# Auth
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here

# URLs y Stripe (producción: claves live + STRIPE_WEBHOOK_SECRET)
FRONTEND_URL=...
BACKEND_URL=...
STRIPE_SECRET_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=...
```

## 🏃‍♂️ Scripts Disponibles

```bash
npm run dev        # Desarrollo local
npm run build      # Build para producción
npm run start      # Servidor de producción
npm run check      # Verificación TypeScript
npm run db:push    # Aplicar cambios de schema
```

## 📂 Estructura del Proyecto

```
├── client/           # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas principales
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilidades
├── server/           # Backend Express
│   ├── routes.ts       # Rutas principales
│   ├── storage.ts      # Capa de datos
│   ├── supabaseAuth.ts # Autenticación
│   └── db.ts          # Configuración DB
├── shared/           # Schemas compartidos
│   └── schema.ts      # Drizzle schemas
└── vercel.json       # Configuración deployment
```

## 🔐 Sistema de Autenticación

- **Supabase Auth** para gestión de usuarios
- **JWT tokens** para sesiones
- **Middleware** de autenticación en rutas protegidas
- **Fallback system** durante migración

## 📊 Base de Datos

### Tablas Principales
- `users` - Perfiles de usuario
- `courses` - Contenido educativo
- `categories` - Categorización
- `lessons` - Lecciones individuales
- `user_progress` - Progreso del usuario
- `certificates` - Certificaciones

### Migraciones
```bash
# Aplicar cambios de schema
npm run db:push

# Forzar cambios (cuidado en producción)
npm run db:push --force
```

## 🔧 Desarrollo

### Componentes UI
- Usando **shadcn/ui** como base
- **Tailwind CSS** para styling
- **Framer Motion** para animaciones
- **Lucide React** para iconos

### Estado y Data Fetching
- **TanStack Query** para cache y sincronización
- **React Hook Form** + **Zod** para formularios
- **Optimistic updates** en operaciones críticas

### Routing
- **Wouter** para navegación client-side
- **Protected routes** con middleware de auth
- **Dynamic routing** para cursos y lecciones

## 🚀 Deployment

### Vercel
1. Conectar repositorio en Vercel
2. Configurar variables de entorno
3. Deploy automático desde main branch

### Supabase
1. Crear proyecto en supabase.com
2. Aplicar schemas con `npm run db:push`
3. Configurar Storage buckets
4. Configurar Auth providers

## 🛠️ Comandos Útiles

```bash
# Desarrollo con hot reload
npm run dev

# Build y preview local
npm run build
npm run start

# Verificar tipos
npm run check

# Limpiar cache
rm -rf node_modules/.cache
rm -rf dist
```

## 📚 Features Principales

### 🎓 Sistema LMS
- Progreso de cursos en tiempo real
- Sistema de certificaciones
- Recursos descargables
- Video lessons con control de progreso

### 🏠 Landing Page
- Artículos y guías públicas
- Herramientas interactivas
- Filtrado por categorías
- SEO optimizado

### 🎯 Universidad NoCode
- Catálogo de cursos premium
- Planes de suscripción
- Sistema de matriculación
- Dashboard de administración

## 🔄 Migración desde Replit

Este proyecto ha sido migrado desde Replit hacia un stack profesional:
- ✅ Limpieza de dependencias Replit
- ✅ Configuración Supabase
- ✅ Optimización para Vercel
- ✅ Sistema de auth híbrido

## 📞 Soporte

Para issues técnicos, crear un issue en GitHub con:
- Descripción del problema
- Steps to reproduce
- Screenshots si aplica
- Información del entorno