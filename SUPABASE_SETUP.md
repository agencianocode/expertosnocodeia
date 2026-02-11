# 🚀 Configuración de Supabase para Subida de Imágenes

## 📋 Pasos para Habilitar Supabase

### 1. **Crear Proyecto en Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la **URL del proyecto** y la **API Key**

### 2. **Configurar Variables de Entorno**
Crea un archivo `.env` en la raíz del proyecto con:

```env
# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_api_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Development
NODE_ENV=development
```

### 3. **Configurar Storage en Supabase**
1. Ve a **Storage** en tu dashboard de Supabase
2. Crea un bucket llamado `lesson-resources`
3. Configura el bucket como **público**
4. Establece límites de archivo (recomendado: 50MB)

### 4. **Probar la Configuración**

#### Verificar Estado:
```bash
curl http://localhost:5000/api/setup/storage/status
```

#### Configurar Storage:
```bash
curl -X POST http://localhost:5000/api/setup/storage
```

### 5. **Reiniciar el Servidor**
```bash
npm run dev
```

## ✅ **Verificación**

Una vez configurado, podrás:
- ✅ Subir imágenes reales desde tu computadora
- ✅ Ver las imágenes en los cursos
- ✅ Las imágenes se almacenan en Supabase Storage
- ✅ URLs públicas para las imágenes

## 🔧 **Endpoints Disponibles**

- `GET /api/setup/storage/status` - Verificar estado de Supabase
- `POST /api/setup/storage` - Configurar bucket de Supabase
- `POST /api/admin/media/upload-url` - Obtener URL de subida
- `PUT /api/admin/media/upload/:fileName` - Subir archivo
- `GET /api/admin/media/upload/:fileName` - Servir imagen

## 🚨 **Fallback Automático**

Si Supabase no está configurado, el sistema automáticamente:
- Usa imágenes de ejemplo de Unsplash
- Permite crear cursos normalmente
- No interrumpe el flujo de trabajo

## 📝 **Notas**

- Las imágenes se suben al bucket `lesson-resources`
- Se generan nombres únicos para evitar conflictos
- El sistema es compatible con desarrollo y producción
- Fallback automático a imágenes mock si falla Supabase
