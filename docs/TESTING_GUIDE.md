# Guía de Testing y Validación

Esta guía te ayudará a validar que todas las funcionalidades del sistema estén funcionando correctamente.

## 🚀 Inicio Rápido

### 1. Testing Automatizado de Base de Datos

Ejecuta el script de validación:

```bash
npm run test:system
```

Este script verifica:
- ✅ Que todas las tablas necesarias existan
- ✅ Que las columnas requeridas estén presentes
- ✅ Que las variables de entorno estén configuradas
- ✅ Que los índices de performance existan

### 2. Testing Manual Completo

Sigue el checklist detallado en `TESTING_CHECKLIST.md` para validar todas las funcionalidades.

## 📋 Checklist Rápido

### Pre-requisitos
- [ ] Servidor en ejecución (`npm run dev`)
- [ ] Base de datos conectada
- [ ] Variables de entorno configuradas
- [ ] Usuario admin creado

### Testing por Fases

#### Fase 1: CRM
1. Accede a `/admin/users`
2. Verifica que se muestren usuarios
3. Prueba búsqueda y filtros
4. Verifica historial de suscripciones

#### Fase 2: Email Marketing
1. Accede a `/admin/emails`
2. Verifica estado de configuración
3. Envía email de prueba
4. Prueba secuencias automatizadas

#### Fase 3: Beehiiv
1. Accede a `/admin/beehiiv`
2. Verifica configuración
3. Prueba suscripción individual
4. Prueba sincronización masiva

#### Fase 4: Landing Pages
1. Visita `/` (landing marketing)
2. Prueba suscripción al newsletter
3. Visita `/pricing`
4. Prueba checkout (modo test)

#### Fase 5: Automatizaciones
1. Accede a `/admin/automations`
2. Verifica analytics
3. Crea una automatización de prueba
4. Prueba procesamiento manual
5. Verifica logs

#### Segmentación
1. Accede a `/admin/segments`
2. Crea un segmento de prueba
3. Calcula usuarios
4. Usa el segmento en una automatización

#### Onboarding
1. Completa el onboarding como usuario nuevo
2. Verifica redirección a `/recommendations`
3. Verifica que se muestren recomendaciones personalizadas

## 🔍 Verificación de Integraciones

### Stripe
```bash
# Verificar que los webhooks estén configurados
# Usar Stripe CLI para testing local:
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

### Resend
- Verifica que los emails lleguen correctamente
- Revisa logs de Resend dashboard

### Beehiiv
- Verifica en Beehiiv dashboard que los usuarios se suscriban
- Verifica que los tags se agreguen correctamente

## 🐛 Troubleshooting Común

### Error: "Tabla no existe"
**Solución**: Ejecuta la migración SQL:
```bash
# Copia el contenido de migrations/0008_add_automations_tables.sql
# y ejecútalo en tu cliente SQL
```

### Error: "Variable de entorno no configurada"
**Solución**: Verifica tu archivo `.env`:
```bash
# Verifica que todas las variables estén presentes
npm run test:system
```

### Error: "500 Internal Server Error"
**Solución**: 
1. Revisa los logs del servidor
2. Verifica que la base de datos esté conectada
3. Verifica que todas las tablas existan

### Error: "401 Unauthorized"
**Solución**: 
1. Verifica que estés autenticado
2. Verifica que tengas permisos de admin
3. Revisa el token de autenticación

## 📊 Métricas a Verificar

### Performance
- Dashboard carga en < 2 segundos
- Búsqueda de usuarios es instantánea
- Cálculo de segmentos < 5 segundos

### Funcionalidad
- Todas las automatizaciones se ejecutan correctamente
- Los emails se envían sin errores
- Las sincronizaciones con Beehiiv funcionan
- Los webhooks de Stripe se procesan

## ✅ Criterios de Éxito

El sistema está listo para producción cuando:
- ✅ Todos los tests automatizados pasan
- ✅ Todas las funcionalidades principales funcionan
- ✅ No hay errores en consola del navegador
- ✅ No hay errores en logs del servidor
- ✅ Las integraciones externas funcionan
- ✅ El performance es aceptable

## 📝 Reporte de Testing

Después de completar el testing, documenta:
1. Funcionalidades probadas
2. Errores encontrados
3. Mejoras sugeridas
4. Estado general del sistema

