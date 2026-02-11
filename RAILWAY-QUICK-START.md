# 🚂 Railway - Inicio Rápido

## ⚡ Pasos Rápidos (5 minutos)

### 1. Crear Proyecto en Railway
- Ve a [railway.app](https://railway.app)
- **New Project** → **Deploy from GitHub repo**
- Selecciona: `agencianocode/expertosnocodeia`

### 2. Agregar Base de Datos
- En Railway: **+ New** → **Database** → **Add PostgreSQL**
- Railway creará `DATABASE_URL` automáticamente ✅

### 3. Configurar Variables de Entorno
En Railway → **Variables**, agrega:

```env
# OBLIGATORIAS
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui
FRONTEND_URL=https://tu-proyecto.railway.app
NODE_ENV=production
PORT=5000

# RECOMENDADAS
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@tudominio.com
SESSION_SECRET=$(openssl rand -base64 32)
```

### 4. Deploy Automático
- Railway detectará los cambios automáticamente
- El deploy comenzará en ~2 minutos
- Verás el progreso en **Deployments**

### 5. Verificar
- Ve a tu dominio Railway (ej: `tu-proyecto.railway.app`)
- Deberías ver tu aplicación funcionando ✅

---

## 📚 Documentación Completa

Para instrucciones detalladas, ver: **[RAILWAY-DEPLOY.md](./RAILWAY-DEPLOY.md)**

---

## ✅ Checklist Pre-Deploy

- [ ] Repositorio sincronizado con GitHub ✅
- [ ] Build funciona localmente (`npm run build`) ✅
- [ ] Variables de entorno listas
- [ ] Base de datos configurada
- [ ] Dominio configurado (opcional)

---

## 🆘 Problemas Comunes

**Build falla:**
- Verifica que `npm run build` funciona localmente
- Revisa los logs en Railway

**App no carga:**
- Verifica que `FRONTEND_URL` coincide con tu dominio Railway
- Revisa los logs del servidor

**Base de datos no conecta:**
- Verifica que `DATABASE_URL` está configurada
- Asegúrate de que la DB está activa en Railway

---

**¡Listo para deploy!** 🚀

