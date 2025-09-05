# Configuración para desarrollo local (Cursor.ai / VS Code)

## 1. Requisitos del sistema
- Node.js 18+ (recomendado: 20+)
- PostgreSQL (local o remoto)
- Git

## 2. Variables de entorno
Crea un archivo `.env` en la raíz del proyecto con:

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:password@localhost:5432/rundown_university

# Autenticación (opcional para desarrollo local)
SESSION_SECRET=tu-session-secret-local

# Para desarrollo local sin Replit Auth
NODE_ENV=development

# Si quieres usar Replit Object Storage desde local
DEFAULT_OBJECT_STORAGE_BUCKET_ID=tu-bucket-id
PRIVATE_OBJECT_DIR=/tu-bucket/private
PUBLIC_OBJECT_SEARCH_PATHS=/tu-bucket/public

# Dominios para Replit Auth (solo si usas auth)
REPLIT_DOMAINS=localhost:5000
REPL_ID=tu-repl-id
ISSUER_URL=https://replit.com/oidc
```

## 3. Instalación y configuración

```bash
# Clonar el repositorio
git clone tu-repositorio-github
cd tu-proyecto

# Instalar dependencias
npm install

# Configurar base de datos
npm run db:push

# Poblar datos iniciales (opcional)
npm run seed

# Ejecutar en desarrollo
npm run dev
```

## 4. Diferencias principales vs Replit

### Base de datos
- **Replit**: PostgreSQL automático con Neon
- **Local**: Necesitas PostgreSQL local o usar un servicio como:
  - Supabase (gratis)
  - Neon (gratis) 
  - PostgreSQL local con Docker

### Autenticación
- **Replit**: Replit Auth automático
- **Local**: Opciones:
  - Deshabilitar auth temporalmente
  - Usar Google Auth / GitHub Auth
  - Auth0 o similar

### Object Storage  
- **Replit**: Object Storage automático
- **Local**: Opciones:
  - AWS S3
  - Google Cloud Storage
  - Cloudinary
  - Almacenamiento local (para desarrollo)

## 5. Scripts de package.json que funcionan igual

Todos estos scripts funcionan igual en local:
- `npm run dev` - Desarrollo
- `npm run build` - Construcción
- `npm run db:push` - Migraciones
- `npm run db:studio` - Visualizador DB

## 6. Recomendaciones para Cursor.ai

### Extensiones útiles:
- TypeScript
- Tailwind CSS IntelliSense  
- ESLint
- Prettier
- PostgreSQL (para base de datos)

### Configuración de Cursor:
- Asegúrate de que reconozca los paths aliases (`@/`, `@shared/`)
- Habilita TypeScript estricto
- Usa el formato automático con Prettier

## 7. Mantener sincronización con Replit

Si quieres seguir usando ambos:
1. Usa GitHub como repositorio central
2. Push cambios desde cualquier entorno
3. Pull cambios en el otro entorno
4. Las variables de entorno se manejan por separado en cada uno