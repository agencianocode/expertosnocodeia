# Checklist: Despliegue en Railway (variables, Stripe, Google OAuth)

Guía paso a paso para configurar variables de entorno, webhook de Stripe y Google OAuth antes de grabar y lanzar la plataforma.

---

## 1. Variables de entorno en Railway

En el panel de Railway → tu proyecto → **Variables** (o en cada servicio si tienes varios):

### Obligatorias (servidor / backend)

| Variable | Descripción | Ejemplo producción |
|----------|-------------|---------------------|
| `NODE_ENV` | Entorno | `production` |
| `FRONTEND_URL` | URL pública del frontend | `https://app.expertosnocodeia.com` o `https://tu-app.railway.app` |
| `BACKEND_URL` | URL pública del API (mismo que el servidor si todo va en un solo servicio) | `https://tu-app.railway.app` |
| `DATABASE_URL` | Conexión PostgreSQL (Supabase) | `postgresql://postgres:...@...supabase.co:5432/postgres` |
| `SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Anon key de Supabase | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase | `eyJ...` |
| `JWT_SECRET` | Secreto para JWT | Cadena larga y aleatoria |
| `SESSION_SECRET` | Secreto para sesiones | Cadena larga y aleatoria |
| `STRIPE_SECRET_KEY` | Clave **live** de Stripe (producción) | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Signing secret del webhook (ver sección 2) | `whsec_...` |
| `GOOGLE_CLIENT_ID` | OAuth Google | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth Google | `GOCSPX-...` |

### Para el build del cliente (Vite)

Si el frontend se construye en Railway, las variables que usa el **cliente** deben estar disponibles en el **momento del build** y tener el prefijo `VITE_`:

| Variable | Descripción |
|----------|-------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe (pk_live_... en producción) |
| `VITE_SUPABASE_URL` | Misma que `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Misma que `SUPABASE_ANON_KEY` |

**Importante:** No subas `.env` al repositorio. Usa solo las variables del panel de Railway.

---

## 2. Webhook de Stripe

El backend recibe eventos de Stripe en:

```
POST https://<TU-BACKEND>/api/webhooks/stripe
```

### Pasos en Stripe Dashboard

1. Entra en [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**.
2. **Add endpoint**.
3. **Endpoint URL:** `https://<tu-dominio-backend>/api/webhooks/stripe`  
   Ejemplo: `https://tu-app.railway.app/api/webhooks/stripe`
4. **Eventos a suscribir** (los que usa esta app):
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Crear el endpoint y copiar el **Signing secret** (empieza por `whsec_...`).
6. En Railway, añadir o editar la variable:  
   `STRIPE_WEBHOOK_SECRET` = ese valor.

### Producción (modo Live)

- Usa claves **live** en producción: `STRIPE_SECRET_KEY` = `sk_live_...`, `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`.
- Crea un **webhook distinto** en modo Live (o el mismo endpoint en el entorno Live) y configura de nuevo `STRIPE_WEBHOOK_SECRET` con el signing secret del webhook en Live.

---

## 3. Google OAuth

El login con Google redirige a tu backend; el backend debe estar autorizado en Google Cloud.

### URI de redirección

La URL de callback que usa el servidor es:

```
https://<TU-BACKEND>/api/auth/google/callback
```

`<TU-BACKEND>` debe ser exactamente la misma que `BACKEND_URL` (sin barra final).  
Ejemplo: `https://tu-app.railway.app/api/auth/google/callback`

### Pasos en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com) → tu proyecto → **APIs & Services** → **Credentials**.
2. Abre el **OAuth 2.0 Client ID** que usas (tipo “Web application”).
3. En **Authorized redirect URIs**, añade:
   - Desarrollo: `http://localhost:5000/api/auth/google/callback` (si aplica).
   - Producción: `https://<tu-dominio-backend>/api/auth/google/callback`.
4. Guarda los cambios.

Si el backend está en Railway con dominio tipo `xxx.railway.app`, la URI será algo como:

`https://xxx.railway.app/api/auth/google/callback`

Cuando tengas dominio custom (ej. `api.expertosnocodeia.com`), añade también esa URI.

---

## 4. Resumen rápido

- **Railway Variables:** Todas las del `.env.example` (sin subir `.env`); en producción, claves **live** de Stripe y URLs públicas.
- **Stripe:** Webhook apuntando a `https://<backend>/api/webhooks/stripe`, eventos listados arriba, `STRIPE_WEBHOOK_SECRET` en Railway.
- **Google OAuth:** Añadir en “Authorized redirect URIs” la URL `https://<backend>/api/auth/google/callback`.

Si algo falla (pagos, login con Google), revisar logs del servidor en Railway y, para Stripe, el apartado “Webhooks” en el Dashboard para ver intentos y errores.

---

## 5. Checklist para ir tachando

Marca cuando completes cada paso (cambia `[ ]` por `[x]` en el archivo):

- [ ] **Variables en Railway:** Todas las del servidor (NODE_ENV, FRONTEND_URL, BACKEND_URL, DATABASE_URL, Supabase, JWT_SECRET, SESSION_SECRET, Stripe, Google OAuth) y las VITE_* para el build del cliente.
- [ ] **Stripe webhook:** Endpoint creado en Stripe (modo Live si es producción) con URL `https://<tu-backend>/api/webhooks/stripe`, eventos suscritos, y `STRIPE_WEBHOOK_SECRET` copiado a Railway.
- [ ] **Google OAuth:** En Google Cloud Console, añadida la URI `https://<tu-backend>/api/auth/google/callback` en "Authorized redirect URIs".
