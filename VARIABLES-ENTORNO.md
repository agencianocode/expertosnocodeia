# 🔐 Variables de Entorno Requeridas

## ⚠️ IMPORTANTE: Configuración para Checkout Embebido

Para que el **checkout embebido** funcione correctamente, necesitas configurar la siguiente variable de entorno en tu archivo `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_publishable_key_aqui
```

---

## 📋 **Todas las Variables de Entorno**

Copia esto a tu archivo `.env` en la raíz del proyecto:

```env
# ====================
# BASE DE DATOS
# ====================
DATABASE_URL=postgresql://user:password@host:5432/database

# ====================
# SUPABASE
# ====================
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# ====================
# STRIPE (PAGOS)
# ====================
# Secret Key (Backend) - NO compartir, solo servidor
STRIPE_SECRET_KEY=sk_test_tu_secret_key_aqui

# Publishable Key (Frontend) - Segura para el navegador
# ⭐ NUEVA - REQUERIDA PARA CHECKOUT EMBEBIDO
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_publishable_key_aqui

# Webhook Secret (para verificar eventos de Stripe)
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui

# ====================
# URLs
# ====================
FRONTEND_URL=http://localhost:5000

# ====================
# EMAIL (RESEND)
# ====================
RESEND_API_KEY=tu_resend_api_key_aqui
FROM_EMAIL=noreply@tudominio.com

# ====================
# BEEHIIV (OPCIONAL)
# ====================
BEEHIIV_API_KEY=tu_beehiiv_api_key_aqui
BEEHIIV_PUBLICATION_ID=tu_publication_id_aqui

# ====================
# GOOGLE OAUTH (OPCIONAL)
# ====================
GOOGLE_CLIENT_ID=tu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui

# ====================
# ENTORNO
# ====================
NODE_ENV=development
```

---

## 🔑 **¿Dónde Conseguir las Keys de Stripe?**

### **1. Stripe Secret Key y Publishable Key**

1. Ve a tu [Dashboard de Stripe](https://dashboard.stripe.com/)
2. Navega a **Developers** → **API keys**
3. Copia:
   - **Secret key** (empieza con `sk_test_`) → `STRIPE_SECRET_KEY`
   - **Publishable key** (empieza con `pk_test_`) → `VITE_STRIPE_PUBLISHABLE_KEY`

### **2. Stripe Webhook Secret**

1. En Stripe Dashboard, ve a **Developers** → **Webhooks**
2. Haz clic en **Add endpoint**
3. Endpoint URL: `https://tudominio.com/api/webhooks/stripe` (o `http://localhost:5000/api/webhooks/stripe` para desarrollo local)
4. Selecciona los eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copia el **Signing secret** (empieza con `whsec_`) → `STRIPE_WEBHOOK_SECRET`

---

## ⚡ **Variables con Prefijo VITE_**

Las variables que empiezan con `VITE_` son especiales:
- ✅ Se exponen al navegador (frontend)
- ✅ Son seguras de usar en código cliente
- ⚠️ **NUNCA** pongas keys secretas con prefijo `VITE_`

**Variables para Frontend (con VITE_):**
- `VITE_STRIPE_PUBLISHABLE_KEY` ✅ (segura, diseñada para navegador)

**Variables para Backend (sin VITE_):**
- `STRIPE_SECRET_KEY` ❌ (nunca exponer al navegador)
- `STRIPE_WEBHOOK_SECRET` ❌ (solo en servidor)
- `DATABASE_URL` ❌ (solo en servidor)
- `SUPABASE_SERVICE_ROLE_KEY` ❌ (solo en servidor)

---

## 🔄 **Después de Agregar Variables**

1. **Reinicia el servidor:**
   ```bash
   # Para el servidor (Ctrl+C en la terminal)
   # Luego reinicia
   npm run dev
   ```

2. **Verifica que se cargaron:**
   - Las variables se cargan automáticamente con `dotenv`
   - Para frontend, Vite las carga automáticamente

3. **Prueba el checkout:**
   - Ve a `/planes`
   - Haz clic en "Empezar ahora"
   - Deberías ver el formulario de pago embebido

---

## ✅ **Verificación Rápida**

Para verificar que todo está configurado:

```bash
# En la consola del navegador (F12):
console.log('Stripe Key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Configurada ✅' : 'Falta ❌');

# En los logs del servidor, deberías ver:
# ✅ Stripe configurado correctamente
```

---

## 🆘 **¿Problemas?**

Si el checkout no carga:
1. Verifica que `VITE_STRIPE_PUBLISHABLE_KEY` esté en `.env`
2. Reinicia el servidor (`npm run dev`)
3. Limpia caché del navegador (Ctrl+Shift+R)
4. Revisa la consola del navegador (F12) para errores

---

**Última actualización**: 3 de diciembre de 2025

