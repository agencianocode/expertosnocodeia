# ✅ Checklist de Producción - Expertos NoCode IA

## 🔐 Variables de Entorno Requeridas

Configura estas variables en tu servidor de producción (Vercel, Railway, etc.):

### **CRÍTICAS (Obligatorias)**

```env
# Base de Datos
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Frontend URL (IMPORTANTE: Usar dominio de producción)
FRONTEND_URL=https://tu-dominio.com

# Autenticación
SESSION_SECRET=[GENERAR NUEVO - usar: openssl rand -base64 32]
```

### **PAGOS (Si usas Stripe)**

```env
# Stripe Backend
STRIPE_SECRET_KEY=sk_live_tu_secret_key_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui

# Stripe Frontend (con prefijo VITE_)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_tu_publishable_key_aqui
```

### **EMAILS (Si usas Resend)**

```env
RESEND_API_KEY=tu_resend_api_key_aqui
FROM_EMAIL=noreply@tudominio.com
```

### **OPCIONALES**

```env
# Google OAuth (si lo usas)
GOOGLE_CLIENT_ID=tu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui

# Beehiiv (si lo usas)
BEEHIIV_API_KEY=tu_beehiiv_api_key_aqui
BEEHIIV_PUBLICATION_ID=tu_publication_id_aqui

# Entorno
NODE_ENV=production
PORT=5000
```

---

## ✅ Checklist Pre-Deploy

### **1. Configuración del Servidor**
- [x] CORS configurado para dominio de producción
- [x] Host configurado para escuchar en `0.0.0.0` (producción)
- [ ] Variables de entorno configuradas en el servidor
- [ ] `FRONTEND_URL` apunta al dominio de producción (no localhost)

### **2. Build y Deploy**
- [x] Build funciona correctamente (`npm run build`)
- [ ] Servidor de producción probado (`npm start`)
- [ ] Archivos estáticos se sirven correctamente
- [ ] No hay errores en consola del navegador

### **3. Base de Datos**
- [ ] `DATABASE_URL` apunta a Supabase (no Neon)
- [ ] SSL configurado correctamente
- [ ] Migraciones aplicadas (`npm run db:push`)
- [ ] Datos de prueba eliminados (si aplica)

### **4. Autenticación**
- [ ] Supabase Auth configurado
- [ ] URLs de callback configuradas en Supabase Dashboard
- [ ] `SESSION_SECRET` generado nuevo (no usar el de desarrollo)

### **5. Storage (Supabase)**
- [ ] Buckets creados en Supabase Storage
- [ ] Políticas de acceso configuradas
- [ ] Uploads funcionando correctamente

### **6. Seguridad**
- [ ] No hay API keys hardcodeadas en el código
- [ ] Variables sensibles solo en variables de entorno
- [ ] HTTPS/SSL configurado
- [ ] CORS restringido a dominios permitidos

### **7. Funcionalidades Críticas**
- [ ] Login/Registro funcionando
- [ ] Guardado de guías/cursos funcionando
- [ ] Upload de imágenes funcionando
- [ ] Pagos (si aplica) funcionando
- [ ] Emails (si aplica) funcionando
- [ ] Comunidad (posts, comentarios) funcionando

### **8. Dominio y DNS**
- [ ] Dominio configurado
- [ ] DNS apuntando correctamente
- [ ] SSL/HTTPS activo
- [ ] Redirección de HTTP a HTTPS

---

## 🚀 Proceso de Deploy

### **1. Preparación Local**
```bash
# Verificar que todo funciona
npm run build
npm start

# Verificar variables de entorno
# (asegúrate de tener un .env con valores de prueba)
```

### **2. Configurar Servidor de Producción**

#### **Si usas Vercel:**
1. Conecta tu repositorio
2. Configura variables de entorno en Settings > Environment Variables
3. Configura Build Command: `npm run build`
4. Configura Output Directory: `dist/public`
5. Configura Install Command: `npm install`

#### **Si usas Railway/Render:**
1. Conecta tu repositorio
2. Configura variables de entorno
3. Configura Start Command: `npm start`
4. Configura Build Command: `npm run build`

### **3. Post-Deploy**
- [ ] Probar login/registro
- [ ] Probar funcionalidades principales
- [ ] Verificar que las imágenes cargan
- [ ] Verificar que los emails se envían (si aplica)
- [ ] Verificar que los pagos funcionan (si aplica)
- [ ] Revisar logs del servidor para errores

---

## 🔍 Verificación Post-Deploy

### **Endpoints a Probar:**
- `GET /api/health` - Debe retornar `{ status: 'ok' }`
- `GET /api/courses` - Debe retornar lista de cursos
- `GET /api/guides` - Debe retornar lista de guías
- `POST /api/auth/login` - Debe funcionar con credenciales válidas

### **Páginas a Verificar:**
- `/` - Página principal carga
- `/courses` - Lista de cursos
- `/guides` - Lista de guías
- `/login` - Formulario de login
- `/dashboard` - Dashboard (requiere auth)

---

## ⚠️ Problemas Comunes

### **Error: "CORS policy"**
- **Solución**: Verificar que `FRONTEND_URL` está configurado correctamente
- Verificar que el dominio está en la lista de allowedOrigins

### **Error: "Database connection failed"**
- **Solución**: Verificar `DATABASE_URL` apunta a Supabase
- Verificar que el proyecto de Supabase está activo
- Verificar credenciales

### **Error: "Image upload failed"**
- **Solución**: Verificar buckets en Supabase Storage
- Verificar políticas de acceso en Supabase
- Verificar `SUPABASE_SERVICE_ROLE_KEY`

### **Error: "Stripe checkout not working"**
- **Solución**: Verificar `STRIPE_SECRET_KEY` y `VITE_STRIPE_PUBLISHABLE_KEY`
- Verificar que estás usando keys de producción (no test)
- Verificar webhook configurado en Stripe Dashboard

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs del servidor
2. Revisa la consola del navegador (F12)
3. Verifica que todas las variables de entorno están configuradas
4. Verifica que el dominio está correctamente configurado

