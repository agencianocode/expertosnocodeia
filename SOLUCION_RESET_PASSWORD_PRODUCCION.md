# 🚀 Solución: Reset Password en Producción

## 🚨 Problema

El link `https://expertosnocodeia.com/reset-password?token=...` no funciona.

## ✅ Solución Completa (3 Pasos)

### **Paso 1: Configurar Variables de Entorno en Vercel**

1. Ve a tu proyecto en Vercel: https://vercel.com
2. Selecciona tu proyecto `expertosnocodeia`
3. Ve a **Settings** > **Environment Variables**
4. Agrega estas variables:

   ```
   Nombre: VITE_SUPABASE_URL
   Valor: https://ehmihfufuufthefwrnrb.supabase.co
   Environments: Production, Preview, Development
   ```

   ```
   Nombre: VITE_SUPABASE_ANON_KEY
   Valor: [tu anon key de Supabase]
   Environments: Production, Preview, Development
   ```

   **¿Dónde encontrar el ANON_KEY?**
   - Dashboard de Supabase > Settings > API
   - Copiar `anon public` key

5. Haz clic en **"Save"** para cada variable

### **Paso 2: Configurar Redirect URLs en Supabase**

1. Ve al Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** > **URL Configuration**

4. En **"Site URL"**, configura:
   ```
   https://expertosnocodeia.com
   ```

5. En **"Redirect URLs"**, agrega (una por línea):
   ```
   https://expertosnocodeia.com/reset-password
   https://expertosnocodeia.com/*
   https://expertosnocodeia.com/auth/callback
   http://localhost:5000/reset-password
   http://localhost:5000/*
   ```

6. Haz clic en **"Save"**

### **Paso 3: Redesplegar en Vercel**

#### Opción A: Desde Vercel Dashboard
1. Ve a tu proyecto en Vercel
2. Pestaña **"Deployments"**
3. Encuentra el último deployment
4. Click en los **"..."** (tres puntos)
5. Click en **"Redeploy"**
6. Espera a que termine el deployment (2-3 minutos)

#### Opción B: Desde Git
```bash
# Hacer un commit vacío para forzar redeploy
git commit --allow-empty -m "Redeploy con variables de entorno"
git push
```

## 🧪 Probar que Funciona

### Prueba 1: Variables de Entorno
Después del redeploy, abre la consola del navegador en:
```
https://expertosnocodeia.com
```

Y ejecuta:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
// Debería mostrar: https://ehmihfufuufthefwrnrb.supabase.co
```

Si muestra `undefined`, las variables no están cargadas correctamente.

### Prueba 2: Flujo Completo

1. **Solicitar Reset**:
   - Ve a: https://expertosnocodeia.com/forgot-password
   - Ingresa: `agenciadenocode@gmail.com`
   - Enviar

2. **Click en el Email**:
   - Abre el email de Supabase
   - Click en el link

3. **Página de Reset**:
   - Deberías ver la página de reset de contraseña
   - Ingresa nueva contraseña
   - Confirma

4. **Login**:
   - Ve a: https://expertosnocodeia.com/login
   - Login con la nueva contraseña
   - ✅ Deberías poder entrar

## 🔍 Verificar Deployment

### Ver Logs del Deployment

1. Vercel Dashboard
2. Tu proyecto > Deployments
3. Click en el deployment más reciente
4. Pestaña **"Logs"**
5. Busca errores relacionados con variables de entorno

### Verificar Variables en el Build

En los logs, deberías ver algo como:
```
✓ Environment Variables loaded
VITE_SUPABASE_URL = https://ehmihfufuufthefwrnrb.supabase.co
```

## 🚨 Solución de Problemas

### Error: "Cannot read properties of undefined"

**Causa**: Variables de entorno no cargadas en producción

**Solución**:
1. Verifica que agregaste las variables en Vercel
2. Verifica que seleccionaste "Production" environment
3. Redespliega el proyecto
4. Limpia cache del navegador: Ctrl+Shift+R

### Link sigue sin funcionar

**Causa**: Redirect URL no configurado correctamente

**Solución**:
1. Ve a Supabase Dashboard
2. Authentication > URL Configuration
3. Verifica que `https://expertosnocodeia.com/*` está en la lista
4. Guarda cambios
5. Espera 2-3 minutos
6. Solicita nuevo reset de contraseña

### Página 404

**Causa**: Routing no configurado en Vercel

**Solución**: El archivo `vercel.json` debe tener:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

### Variables no se cargan

**Causa**: Nombre incorrecto de las variables

**Solución**: DEBEN empezar con `VITE_`:
- ✅ `VITE_SUPABASE_URL`
- ❌ `SUPABASE_URL` (esta es para el backend)

## 📝 Configuración de Email en Supabase (Opcional)

Para personalizar el email y asegurar el link correcto:

1. Dashboard de Supabase
2. **Authentication** > **Email Templates**
3. Selecciona **"Reset Password"**
4. Verifica que el template use:
   ```
   {{ .SiteURL }}/reset-password?token={{ .Token }}
   ```
5. El `SiteURL` debe ser `https://expertosnocodeia.com`

## ✅ Checklist Completo

- [ ] Variables `VITE_SUPABASE_*` agregadas en Vercel
- [ ] Variables aplicadas a Production environment
- [ ] Redirect URLs configuradas en Supabase
- [ ] Site URL configurada en Supabase (`https://expertosnocodeia.com`)
- [ ] Proyecto redespliegado en Vercel
- [ ] Cache del navegador limpiado
- [ ] Flujo de reset probado en producción

## 🎯 Resumen

**Antes:**
```
Link de email → ❌ Página no carga en producción
```

**Después:**
```
Link de email → ✅ Página de reset → ✅ Nueva contraseña → ✅ Login
```

## 📊 Comparación: Desarrollo vs Producción

| Configuración | Desarrollo | Producción |
|--------------|-----------|------------|
| Variables entorno | `.env` local | Vercel Environment Variables |
| URL base | `localhost:5000` | `expertosnocodeia.com` |
| Redirect URLs | `localhost:5000/*` | `expertosnocodeia.com/*` |
| Deployment | `npm run dev` | Push a git → Auto-deploy |

## 🚀 Quick Fix

Si tienes prisa, ejecuta esto:

1. **Agregar variables en Vercel** (desde el dashboard)
2. **Redeploy**:
   ```bash
   git commit --allow-empty -m "Fix: Add Supabase env vars"
   git push
   ```
3. **Mientras tanto, prueba en desarrollo**:
   ```bash
   # Local
   npm run dev
   # Abre: http://localhost:5000
   ```

---

**Tiempo estimado**: 5-10 minutos (incluyendo deployment)

**¿Necesitas ayuda con algún paso?** 🚀

