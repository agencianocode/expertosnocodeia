# 🚂 Guía de Deploy en Railway

Esta guía te ayudará a desplegar tu aplicación en Railway paso a paso.

---

## 📋 **Prerequisitos**

1. ✅ Cuenta en [Railway](https://railway.app) (gratis con $5 de crédito mensual)
2. ✅ Repositorio en GitHub sincronizado (ya completado ✅)
3. ✅ Variables de entorno listas (ver sección abajo)

---

## 🚀 **Paso 1: Crear Proyecto en Railway**

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Haz clic en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway para acceder a tu GitHub
5. Selecciona el repositorio: `agencianocode/expertosnocodeia`
6. Railway detectará automáticamente que es un proyecto Node.js

---

## ⚙️ **Paso 2: Configurar Node.js 20**

Railway debería detectar automáticamente Node.js 20 desde `railway.json`, pero si no:
1. Ve a **Settings** → **Service**
2. En **Build Command**, asegúrate de que esté: `npm run build`
3. En **Start Command**, asegúrate de que esté: `npm start`
4. Railway usará Node.js 20 automáticamente (configurado en `railway.json`)

## ⚙️ **Paso 3: Configurar Variables de Entorno**

En Railway, ve a tu proyecto → **Variables** y agrega todas estas variables:

### 🔴 **OBLIGATORIAS (sin estas no funcionará):**

```env
# Base de Datos PostgreSQL
# OPCIÓN A: Si usas Railway PostgreSQL (creada automáticamente)
# Railway crea DATABASE_URL automáticamente, pero puedes sobrescribirla
# Si la creas manualmente, usa el formato:
DATABASE_URL=postgresql://postgres:TU_PASSWORD@TU_HOST:5432/railway

# OPCIÓN B: Si usas Supabase PostgreSQL (RECOMENDADO)
# IMPORTANTE: Usa el POOLER, no la conexión directa
# Formato correcto:
DATABASE_URL=postgresql://postgres.TU_PROJECT_REF:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
# Obtén esta URL en: Supabase Dashboard > Settings > Database > Connection Pooling > Session mode

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Frontend URL (será tu dominio de Railway - ACTUALIZA ESTO después del primer deploy)
FRONTEND_URL=https://tu-proyecto.railway.app

# Entorno
NODE_ENV=production

# Puerto (Railway lo proporciona automáticamente via PORT, no necesitas configurarlo)
# PORT se asigna automáticamente por Railway
```

**⚠️ IMPORTANTE sobre DATABASE_URL:**
- Si tu contraseña tiene caracteres especiales (`@`, `:`, `/`, `#`, etc.), debes codificarlos con URL encoding
- Ejemplo: Si tu password es `p@ss#word`, debe ser `p%40ss%23word` en la URL
- Railway PostgreSQL: Si creaste una DB en Railway, usa la `DATABASE_URL` que Railway te proporciona automáticamente
- Supabase: **SIEMPRE usa el pooler** (`pooler.supabase.com`), nunca la conexión directa (`db.supabase.co`)

### 🟡 **RECOMENDADAS (para funcionalidad completa):**

```env
# Stripe (Pagos)
STRIPE_SECRET_KEY=sk_live_tu_secret_key_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_tu_publishable_key_aqui

# Email (Resend)
RESEND_API_KEY=tu_resend_api_key_aqui
FROM_EMAIL=noreply@tudominio.com

# Sesiones (genera uno nuevo para producción)
SESSION_SECRET=tu_session_secret_seguro_aqui
```

### 🟢 **OPCIONALES:**

```env
# Beehiiv (si lo usas)
BEEHIIV_API_KEY=tu_beehiiv_api_key_aqui
BEEHIIV_PUBLICATION_ID=tu_publication_id_aqui

# Google OAuth (si lo usas)
GOOGLE_CLIENT_ID=tu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui
```

### 🔐 **Generar SESSION_SECRET seguro:**

En tu terminal local:
```bash
openssl rand -base64 32
```

Copia el resultado y úsalo como `SESSION_SECRET`.

---

## 🗄️ **Paso 4: Configurar Base de Datos PostgreSQL**

Railway puede crear una base de datos PostgreSQL automáticamente:

1. En tu proyecto Railway, haz clic en **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará una base de datos y automáticamente agregará la variable `DATABASE_URL` a tu proyecto
4. **¡Listo!** No necesitas hacer nada más

**O si prefieres usar Supabase PostgreSQL:**
- Usa tu `DATABASE_URL` de Supabase directamente
- Agrégala como variable de entorno en Railway

---

## 🏗️ **Paso 5: Configurar Build y Deploy**

Railway detectará automáticamente:
- ✅ `package.json` con scripts de build
- ✅ `railway.json` (ya creado)
- ✅ Comando de inicio: `npm start`

**Verifica que Railway detectó:**
- **Build Command:** `npm run build`
- **Start Command:** `npm start`

Si no lo detecta automáticamente, en **Settings** → **Deploy**:
- Build Command: `npm run build`
- Start Command: `npm start`

---

## 🌐 **Paso 6: Configurar Dominio Personalizado (Opcional)**

### Opción A: Usar dominio de Railway (gratis)
- Railway te dará un dominio como: `tu-proyecto.railway.app`
- Actualiza `FRONTEND_URL` con este dominio

### Opción B: Dominio personalizado
1. En Railway, ve a **Settings** → **Domains**
2. Haz clic en **"Custom Domain"**
3. Ingresa tu dominio (ej: `app.expertosnocodeia.com`)
4. Railway te dará un registro DNS para agregar
5. Agrega el registro en tu proveedor de DNS
6. Espera a que se verifique (puede tardar unos minutos)
7. Actualiza `FRONTEND_URL` con tu dominio personalizado

---

## 🔄 **Paso 7: Primer Deploy**

1. Railway comenzará a hacer deploy automáticamente cuando:
   - Conectes el repositorio
   - Hagas push a `main` (ya está conectado ✅)

2. **Monitorea el deploy:**
   - Ve a la pestaña **"Deployments"**
   - Verás el progreso del build
   - Si hay errores, aparecerán aquí

3. **Verifica los logs:**
   - En la pestaña **"Logs"** verás la salida del servidor
   - Busca: `serving on 0.0.0.0:5000`
   - Si ves errores, revísalos

---

## ✅ **Paso 8: Verificar que Todo Funciona**

1. **Verifica que el servidor está corriendo:**
   - Ve a tu dominio de Railway
   - Deberías ver la aplicación funcionando

2. **Verifica las variables de entorno:**
   - En Railway → **Variables**, confirma que todas están configuradas
   - Especialmente `FRONTEND_URL` debe apuntar a tu dominio de Railway

3. **Prueba funcionalidades clave:**
   - ✅ Login/Registro
   - ✅ Carga de imágenes
   - ✅ Creación de cursos/guías
   - ✅ Pagos (si configuraste Stripe)

---

## 🐛 **Solución de Problemas Comunes**

### Error: "Cannot find module"
**Solución:** Verifica que `npm run build` se ejecutó correctamente. Revisa los logs de build.

### Error: "Port already in use"
**Solución:** Railway asigna el puerto automáticamente. Asegúrate de usar `process.env.PORT` en tu código (ya está configurado ✅).

### Error: "Database connection failed"
**Solución:** 
- Verifica que `DATABASE_URL` está correctamente configurada
- Asegúrate de que la base de datos está activa en Railway
- Verifica que las credenciales son correctas

### Error: "CORS error"
**Solución:** 
- Verifica que `FRONTEND_URL` en Railway coincide con tu dominio real
- Revisa la configuración de CORS en `server/index.ts` (ya está configurada ✅)

### Error: "Build failed"
**Solución:**
- Revisa los logs de build en Railway
- Verifica que todas las dependencias están en `package.json`
- Asegúrate de que `npm run build` funciona localmente

---

## 📊 **Monitoreo y Logs**

- **Logs en tiempo real:** Railway → **Logs**
- **Métricas:** Railway → **Metrics** (CPU, RAM, Red)
- **Deployments:** Railway → **Deployments** (historial de deploys)

---

## 🔄 **Actualizaciones Futuras**

Cada vez que hagas `git push` a `main`, Railway automáticamente:
1. Detectará los cambios
2. Ejecutará `npm run build`
3. Desplegará la nueva versión
4. Reiniciará el servidor

**No necesitas hacer nada manualmente** ✅

---

## 💰 **Costos de Railway**

- **Plan Hobby (Gratis):** $5 de crédito mensual
  - Suficiente para proyectos pequeños/medianos
  - Incluye: 500 horas de uso, 100GB de transferencia
  
- **Plan Pro ($20/mes):** Para proyectos más grandes
  - Créditos ilimitados
  - Mejor soporte

**Tu proyecto probablemente cabe en el plan gratuito** ✅

---

## 🎯 **Checklist Final**

Antes de considerar el deploy completo, verifica:

- [ ] Todas las variables de entorno están configuradas
- [ ] Base de datos está conectada y funcionando
- [ ] El build se completa sin errores
- [ ] El servidor inicia correctamente (revisa logs)
- [ ] La aplicación carga en el navegador
- [ ] Login/Registro funciona
- [ ] Carga de imágenes funciona
- [ ] Stripe funciona (si lo usas)
- [ ] Email funciona (si lo usas)
- [ ] `FRONTEND_URL` está actualizada con el dominio correcto

---

## 🆘 **Soporte**

Si tienes problemas:
1. Revisa los **Logs** en Railway
2. Verifica las **Variables de Entorno**
3. Compara con el entorno local (si funciona localmente)
4. Revisa la documentación de Railway: [docs.railway.app](https://docs.railway.app)

---

## ✅ **¡Listo!**

Una vez completados estos pasos, tu aplicación estará desplegada y funcionando en Railway.

**Próximos pasos recomendados:**
- Configurar dominio personalizado
- Configurar monitoreo (opcional)
- Configurar backups automáticos de la base de datos

