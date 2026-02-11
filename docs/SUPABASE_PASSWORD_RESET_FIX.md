# 🔐 Solución: Reset de Contraseña con Supabase

## 🚨 Problema Identificado

Cuando un usuario solicita resetear su contraseña, recibe un email de Supabase con un link como:

```
https://expertosnocodeia.com/reset-password?token=HASH_LARGO
```

Pero este link no funciona porque falta configuración en ambos lados (Supabase y tu app).

## ✅ Solución Completa (3 Pasos)

### **Paso 1: Configurar Redirect URL en Supabase**

1. Ve al Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** > **URL Configuration**
4. En **"Site URL"**, asegúrate que está:
   ```
   https://expertosnocodeia.com
   ```

5. En **"Redirect URLs"**, agrega ESTAS URLs (una por línea):
   ```
   https://expertosnocodeia.com/reset-password
   https://expertosnocodeia.com/*
   http://localhost:5000/reset-password
   http://localhost:5000/*
   ```

6. Haz clic en **"Save"**

### **Paso 2: Agregar Variables de Entorno**

Edita tu archivo `.env` y agrega estas líneas:

```env
# Frontend (Vite) - IMPORTANTE: debe empezar con VITE_
VITE_SUPABASE_URL=https://ehmihfufuufthefwrnrb.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase

# Backend (ya deberías tenerlas)
SUPABASE_URL=https://ehmihfufuufthefwrnrb.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase
```

**¿Dónde encontrar las keys?**
1. Dashboard de Supabase
2. Settings > API
3. Copiar `Project URL` y `anon public` key

### **Paso 3: Reiniciar el Servidor**

```bash
# Detener servidor actual (Ctrl+C)
# Reiniciar
npm run dev
```

## 🧪 Cómo Probar

### Prueba Completa del Flujo:

1. **Solicitar Reset de Contraseña**:
   - Ve a: http://localhost:5000/forgot-password
   - Ingresa: `agenciadenocode@gmail.com`
   - Haz clic en "Enviar"

2. **Revisar Email**:
   - Abre el email de Supabase
   - Haz clic en el link

3. **Resetear Contraseña**:
   - Te redirigirá a `/reset-password?token=...`
   - Ingresa tu nueva contraseña
   - Confirma la contraseña
   - Haz clic en "Restablecer contraseña"

4. **Hacer Login**:
   - Ve a: http://localhost:5000/login
   - Ingresa tu email y la NUEVA contraseña
   - Deberías poder entrar ✅

## 🔍 Verificar si Funcionó

**Después de resetear la contraseña:**

```bash
# Hacer login con la nueva contraseña
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agenciadenocode@gmail.com",
    "password": "tu_nueva_contraseña"
  }'
```

**Respuesta esperada:**
```json
{
  "message": "Login exitoso",
  "user": {
    "id": "...",
    "email": "agenciadenocode@gmail.com",
    ...
  },
  "supabaseToken": "eyJ..."
}
```

## 🚨 Solución de Problemas

### Error: "Invalid credentials"

**Causa**: Variables de entorno no cargadas

**Solución**:
1. Verifica que `.env` tiene las variables `VITE_SUPABASE_*`
2. Reinicia el servidor completamente
3. Limpia cache: `rm -rf node_modules/.cache`

### Error: "Token expired"

**Causa**: El token del email expiró (válido por 1 hora)

**Solución**:
1. Solicita nuevo reset de contraseña
2. Usa el nuevo link inmediatamente

### El link sigue sin funcionar

**Causa**: Redirect URL no configurado en Supabase

**Solución**:
1. Verifica Paso 1 arriba
2. Asegúrate de guardar los cambios en Supabase
3. Espera 1-2 minutos para que se apliquen
4. Solicita nuevo reset

### "Cannot read properties of undefined"

**Causa**: `import.meta.env` no tiene las variables

**Solución**:
```bash
# 1. Verifica el archivo .env
cat .env | grep VITE

# 2. Debe mostrar:
# VITE_SUPABASE_URL=https://...
# VITE_SUPABASE_ANON_KEY=eyJ...

# 3. Si no están, agrégalas y reinicia
npm run dev
```

## 📝 Configuración de Email Templates (Opcional)

Para personalizar el email de Supabase:

1. Dashboard de Supabase
2. **Authentication** > **Email Templates**
3. Selecciona **"Reset Password"**
4. Personaliza el template
5. Asegúrate que el link sea: `{{ .SiteURL }}/reset-password?token={{ .Token }}`

## ✅ Checklist de Configuración

- [ ] Redirect URLs configuradas en Supabase
- [ ] Variables `VITE_SUPABASE_*` en `.env`
- [ ] Servidor reiniciado
- [ ] Página de reset actualizada (ya está)
- [ ] Probado el flujo completo

## 🎯 Resumen

**Antes:**
```
Email → Link → ❌ Página no funciona
```

**Después:**
```
Email → Link → ✅ Página de reset → ✅ Nueva contraseña → ✅ Login funciona
```

## 📚 Recursos

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth/auth-password-reset
- **Configuración de URLs**: https://supabase.com/docs/guides/auth/redirect-urls

---

**¿Todo configurado?** Prueba el flujo completo con `agenciadenocode@gmail.com` 🚀

