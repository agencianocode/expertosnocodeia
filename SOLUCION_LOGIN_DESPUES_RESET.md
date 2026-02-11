# 🔧 Solución: Login Después de Reset de Contraseña

## 🚨 Problema

Después de resetear la contraseña:
- ✅ Login dice "Login exitoso"
- ❌ Pero sigue pidiendo que inicies sesión

## 🔍 Causa

El token de Supabase no está siendo reconocido correctamente por el middleware de autenticación.

## ✅ Solución Rápida (AHORA)

### Opción 1: Limpiar Cache y Reintentar

1. **Abre la consola del navegador** (F12)
2. **Ejecuta esto**:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
3. **Recarga la página** (Ctrl+R)
4. **Intenta hacer login de nuevo**

### Opción 2: Usar el Token Correcto

El problema es que después del login, el token guardado puede no ser el correcto. Prueba esto:

1. **Cierra el navegador completamente**
2. **Abre de nuevo**
3. Ve a: http://localhost:5000/login
4. **Login normalmente**
5. Si falla, abre la consola (F12) y busca errores

## 🔧 Verificar el Token (Debugging)

Abre la consola del navegador (F12) después de hacer login y ejecuta:

```javascript
// Ver el token guardado
console.log('Token:', localStorage.getItem('simpleAuthToken'));

// Probar el endpoint /api/auth/me
fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('simpleAuthToken')}`
  }
})
.then(r => r.json())
.then(d => console.log('User data:', d))
.catch(e => console.error('Error:', e));
```

**Si ves el error**: `"Token inválido o expirado"` → El token no es válido

## 💡 Solución Definitiva

El problema es que el sistema está mezclando tokens de Supabase con tokens legacy. Vamos a forzar que use Supabase correctamente:

### Actualizar el archivo .env

Agrega estas líneas si no las tienes:

```env
VITE_SUPABASE_URL=https://ehmihfufuufthefwrnrb.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

### Probar de Nuevo

1. Ve a: http://localhost:5000
2. Haz logout (si está logueado)
3. Ve a login: http://localhost:5000/login
4. Ingresa tu email y la **nueva contraseña** (la que configuraste en reset)
5. Debería funcionar ✅

## 🧪 Test Manual

Para verificar que el usuario existe correctamente en Supabase:

### En el Dashboard de Supabase:

1. Ve a **Authentication** → **Users**
2. Busca tu email: `agenciadenocode@gmail.com`
3. Deberías verlo en la lista
4. Si no está, algo falló en la migración

## 🚨 Si Sigue Sin Funcionar

Prueba hacer login con el usuario que **SÍ tiene contraseña**:

```
Email: fabianseguraconsultor@gmail.com
Password: [la contraseña original]
```

Si este funciona pero el otro no, el problema es específico del usuario `agenciadenocode@gmail.com`.

## 🔄 Solución Alternativa: Crear Usuario Desde Cero

Si nada funciona, crea un nuevo usuario:

1. Ve a: http://localhost:5000/register
2. Usa un email nuevo (ej: `test@ejemplo.com`)
3. Ingresa contraseña, nombre, apellido
4. Registra
5. Intenta hacer login

Si este nuevo usuario funciona, confirma que el problema era con el usuario migrado.

## 📝 Logs para Debugging

Revisa los logs del servidor cuando intentas hacer login:

```bash
# En la terminal donde corre el servidor, deberías ver:
🔐 Login attempt: { email: 'agenciadenocode@gmail.com', passwordLength: 8 }
✅ User found: { id: '...', email: '...', hasPassword: true }
✅ Password valid
```

Si ves:
- `❌ User not found` → El usuario no existe en la BD
- `❌ Invalid password` → La contraseña no coincide
- `⚠️ Supabase login failed` → Problema con Supabase Auth

## ✅ Checklist de Verificación

- [ ] Token guardado en localStorage (`simpleAuthToken`)
- [ ] Variables `VITE_SUPABASE_*` en `.env`
- [ ] Servidor reiniciado después de agregar variables
- [ ] Cache del navegador limpiado
- [ ] Usuario existe en Supabase Auth (Dashboard → Users)
- [ ] Password resetea correctamente
- [ ] Login con el otro usuario funciona (para descartar problema general)

## 🎯 Próximo Paso Inmediato

**Ejecuta esto en la consola del navegador AHORA:**

```javascript
// 1. Ver qué hay en localStorage
Object.keys(localStorage).forEach(key => {
  console.log(key, ':', localStorage.getItem(key));
});

// 2. Limpiar todo
localStorage.clear();

// 3. Recargar
window.location.reload();
```

Luego intenta hacer login de nuevo.

---

**¿Cuál es el resultado?** Comparte el error específico que ves en la consola (F12 → Console) para ayudarte mejor.

