# Guía de Testing: Verificación de Email

## Resumen

Esta guía cubre el testing completo del sistema de verificación de email, incluyendo expiración de tokens, restricciones de usuarios no verificados, y flujos de reenvío.

## Checklist de Testing

### ✅ Pre-requisitos

- [ ] Base de datos migrada (columna `email_verification_expires` existe)
- [ ] Servidor de desarrollo corriendo (`npm run dev`)
- [ ] Variables de entorno configuradas (Resend, DATABASE_URL)
- [ ] Cliente de email configurado para recibir emails de prueba

---

## 1. Testing de Registro y Generación de Token

### Objetivo
Verificar que al registrar un nuevo usuario se genera un token de verificación con fecha de expiración.

### Pasos

1. **Registrar nuevo usuario**
   - Ir a `/login`
   - Hacer clic en "Registrarse" o cambiar a pestaña de registro
   - Completar formulario:
     - Email: `test-verification@example.com`
     - Contraseña: `Test123456`
     - Nombre: `Test`
     - Apellido: `User`
   - Hacer clic en "Registrarse"

2. **Verificar respuesta del servidor**
   - ✅ Debe mostrar mensaje: "Usuario registrado exitosamente. Por favor verifica tu email."
   - ✅ Debe incluir `requiresEmailVerification: true` en la respuesta
   - ✅ Usuario debe estar logueado automáticamente

3. **Verificar en base de datos**
   ```sql
   SELECT 
     email,
     is_email_verified,
     email_verification_token,
     email_verification_expires,
     created_at
   FROM users
   WHERE email = 'test-verification@example.com';
   ```
   
   **Resultados esperados:**
   - ✅ `is_email_verified` = `false`
   - ✅ `email_verification_token` NO es NULL (debe tener un valor)
   - ✅ `email_verification_expires` NO es NULL
   - ✅ `email_verification_expires` debe ser aproximadamente 24 horas después de `created_at`

4. **Verificar email recibido**
   - ✅ Debe recibir email en `test-verification@example.com`
   - ✅ Asunto: "✨ Verifica tu email - Expertos NoCode IA"
   - ✅ Email debe tener diseño mejorado (header con gradiente, botón destacado)
   - ✅ Debe contener enlace de verificación con token

### Criterios de Éxito
- [ ] Token generado correctamente
- [ ] Fecha de expiración establecida (24 horas)
- [ ] Email enviado con diseño mejorado
- [ ] Usuario puede iniciar sesión pero está marcado como no verificado

---

## 2. Testing de Verificación de Email

### Objetivo
Verificar que el usuario puede verificar su email usando el token del email.

### Pasos

1. **Obtener token del email**
   - Abrir email recibido
   - Copiar el token de la URL: `/verify-email?token=XXXXX`
   - O hacer clic directamente en el botón "Verificar email"

2. **Verificar email**
   - Si haces clic en el botón, debe redirigir a `/verify-email?token=XXXXX`
   - La página debe mostrar "Verificando email..."
   - Después debe mostrar "¡Email verificado!"

3. **Verificar en base de datos**
   ```sql
   SELECT 
     email,
     is_email_verified,
     email_verification_token,
     email_verification_expires
   FROM users
   WHERE email = 'test-verification@example.com';
   ```
   
   **Resultados esperados:**
   - ✅ `is_email_verified` = `true`
   - ✅ `email_verification_token` = NULL (debe ser limpiado)
   - ✅ `email_verification_expires` puede ser NULL o mantener el valor

4. **Verificar en perfil**
   - Ir a `/profile`
   - ✅ NO debe aparecer el banner de "Email no verificado"
   - ✅ En la sección "Datos", el email debe mostrar ícono de verificado (✓ verde)

### Criterios de Éxito
- [ ] Token válido verifica el email correctamente
- [ ] Estado `is_email_verified` actualizado a `true`
- [ ] Token limpiado después de verificación
- [ ] Banner de advertencia desaparece del perfil
- [ ] Usuario puede ahora comentar

---

## 3. Testing de Token Expirado

### Objetivo
Verificar que los tokens expirados son rechazados correctamente.

### Pasos

1. **Crear token expirado manualmente** (para testing)
   ```sql
   UPDATE users
   SET email_verification_expires = NOW() - INTERVAL '25 hours'
   WHERE email = 'test-verification@example.com';
   ```

2. **Obtener token expirado**
   ```sql
   SELECT email_verification_token
   FROM users
   WHERE email = 'test-verification@example.com';
   ```

3. **Intentar verificar con token expirado**
   - Ir a `/verify-email?token=TOKEN_EXPIRADO`
   - ✅ Debe mostrar error: "Token de verificación expirado. Por favor solicita un nuevo enlace"
   - ✅ NO debe verificar el email

4. **Verificar en base de datos**
   - ✅ `is_email_verified` debe seguir siendo `false`
   - ✅ Token debe seguir existiendo (no fue limpiado)

### Criterios de Éxito
- [ ] Tokens expirados son rechazados
- [ ] Mensaje de error claro al usuario
- [ ] Email no se verifica con token expirado
- [ ] Usuario puede solicitar nuevo token

---

## 4. Testing de Reenvío de Email de Verificación

### Objetivo
Verificar que el usuario puede solicitar un nuevo email de verificación.

### Pasos

1. **Crear usuario no verificado** (si no existe)
   - Registrar nuevo usuario o usar uno existente sin verificar

2. **Solicitar reenvío desde perfil**
   - Ir a `/profile` (debe estar logueado)
   - ✅ Debe aparecer banner amarillo: "Email no verificado"
   - Hacer clic en "Reenviar email de verificación"

3. **Verificar respuesta**
   - ✅ Debe mostrar toast: "Email enviado. Se ha enviado un nuevo email de verificación..."
   - ✅ Botón debe mostrar "Enviando..." mientras procesa

4. **Verificar en base de datos**
   ```sql
   SELECT 
     email_verification_token,
     email_verification_expires,
     updated_at
   FROM users
   WHERE email = 'test-verification@example.com';
   ```
   
   **Resultados esperados:**
   - ✅ `email_verification_token` debe tener un NUEVO valor (diferente al anterior)
   - ✅ `email_verification_expires` debe ser aproximadamente 24 horas desde ahora
   - ✅ `updated_at` debe ser actualizado

5. **Verificar nuevo email**
   - ✅ Debe recibir nuevo email con nuevo token
   - ✅ El nuevo token debe funcionar para verificar

### Criterios de Éxito
- [ ] Nuevo token generado
- [ ] Nueva fecha de expiración establecida (24 horas)
- [ ] Email enviado con nuevo token
- [ ] Nuevo token funciona para verificar

---

## 5. Testing de Restricciones para Usuarios No Verificados

### Objetivo
Verificar que usuarios no verificados NO pueden comentar.

### Pasos

1. **Crear usuario no verificado**
   - Registrar nuevo usuario: `test-unverified@example.com`
   - NO verificar el email
   - Asegurarse de estar logueado

2. **Intentar comentar en lección**
   - Ir a cualquier lección de curso
   - Ir a la sección de comentarios
   - ✅ Debe aparecer banner amarillo: "Email no verificado"
   - ✅ Textarea debe estar deshabilitado
   - ✅ Botón "Publicar comentario" debe estar deshabilitado
   - Intentar escribir y enviar comentario (no debería funcionar)

3. **Intentar comentar en comunidad**
   - Ir a `/community`
   - Seleccionar cualquier post
   - Intentar escribir comentario
   - ✅ Debe mostrar error: "Debes verificar tu email para comentar..."
   - ✅ Debe redirigir a `/profile`

4. **Verificar en backend (logs del servidor)**
   - Intentar hacer POST a `/api/lessons/:lessonId/comments`
   - ✅ Debe retornar `403 Forbidden`
   - ✅ Mensaje: "Debes verificar tu email para realizar esta acción..."
   - ✅ Debe incluir `requiresEmailVerification: true`

5. **Verificar después de verificar email**
   - Verificar el email del usuario
   - Intentar comentar nuevamente
   - ✅ Debe funcionar correctamente
   - ✅ Banner de advertencia debe desaparecer

### Criterios de Éxito
- [ ] Usuarios no verificados NO pueden comentar en lecciones
- [ ] Usuarios no verificados NO pueden comentar en comunidad
- [ ] Mensajes de error claros
- [ ] Redirección a perfil para verificar
- [ ] Después de verificar, pueden comentar normalmente

---

## 6. Testing de Flujo Completo

### Objetivo
Verificar el flujo completo desde registro hasta verificación y uso de funcionalidades.

### Pasos

1. **Registro completo**
   - Registrar nuevo usuario
   - ✅ Recibir email de verificación
   - ✅ Token generado con expiración

2. **Verificación**
   - Verificar email usando token del email
   - ✅ Email verificado correctamente
   - ✅ Banner desaparece del perfil

3. **Uso de funcionalidades**
   - Intentar comentar en lección
   - ✅ Debe funcionar (usuario verificado)
   - Intentar comentar en comunidad
   - ✅ Debe funcionar (usuario verificado)

4. **Verificar persistencia**
   - Cerrar sesión
   - Iniciar sesión nuevamente
   - ✅ Estado de verificación debe persistir
   - ✅ Puede comentar sin problemas

### Criterios de Éxito
- [ ] Flujo completo funciona sin errores
- [ ] Estado de verificación persiste entre sesiones
- [ ] Todas las funcionalidades disponibles después de verificar

---

## 7. Testing de Edge Cases

### Casos a Probar

1. **Token inválido**
   - Intentar verificar con token que no existe
   - ✅ Debe mostrar error: "Token de verificación inválido o expirado"

2. **Usuario ya verificado**
   - Intentar verificar email de usuario ya verificado
   - ✅ Debe mostrar: "Tu email ya está verificado"

3. **Reenvío cuando ya está verificado**
   - Usuario verificado intenta reenviar email
   - ✅ Debe mostrar: "Tu email ya está verificado"

4. **Múltiples intentos de verificación**
   - Intentar verificar con mismo token dos veces
   - ✅ Primera vez: éxito
   - ✅ Segunda vez: "Tu email ya está verificado"

5. **Email con caracteres especiales**
   - Registrar con email: `test+verification@example.com`
   - ✅ Debe funcionar correctamente

---

## Scripts de Testing Automatizado

### Verificar Columna en Base de Datos

```bash
npm run db:verify
```

O ejecutar directamente:

```bash
node --import dotenv/config scripts/verify-database-schema.js
```

### Verificar Columna de Expiración Específica

```bash
node --import dotenv/config scripts/check-email-verification-column.js
```

---

## Troubleshooting

### Problema: Email no se envía

**Solución:**
1. Verificar variables de entorno de Resend:
   ```bash
   echo $RESEND_API_KEY
   ```
2. Verificar logs del servidor para errores de Resend
3. Verificar que el email no está en spam

### Problema: Token no funciona

**Solución:**
1. Verificar que el token no ha expirado:
   ```sql
   SELECT email_verification_expires, NOW()
   FROM users
   WHERE email_verification_token = 'TOKEN_AQUI';
   ```
2. Verificar que el token coincide exactamente (case-sensitive)
3. Verificar que el usuario existe

### Problema: Usuario verificado pero sigue sin poder comentar

**Solución:**
1. Verificar en base de datos:
   ```sql
   SELECT is_email_verified FROM users WHERE email = 'EMAIL_AQUI';
   ```
2. Cerrar sesión y volver a iniciar sesión
3. Verificar que el token de sesión se actualizó

---

## Métricas de Éxito

- ✅ 100% de usuarios nuevos reciben email de verificación
- ✅ 100% de tokens tienen fecha de expiración
- ✅ 0% de usuarios no verificados pueden comentar
- ✅ 100% de tokens expirados son rechazados
- ✅ 100% de usuarios pueden reenviar email de verificación

---

## Notas Finales

- Los tokens expiran después de **24 horas**
- Los usuarios pueden solicitar nuevos tokens ilimitadas veces
- El estado de verificación persiste entre sesiones
- Los usuarios no verificados pueden usar la plataforma pero con restricciones

