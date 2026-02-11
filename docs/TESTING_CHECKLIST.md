# Checklist de Testing y Validación - Sistema Completo

## 📋 Fase 1: CRM Básico en Panel Admin

### Dashboard de Usuarios
- [ ] **Acceso al panel**: Verificar que `/admin/users` sea accesible solo para admins
- [ ] **Lista de usuarios**: Verificar que se muestren todos los usuarios correctamente
- [ ] **Búsqueda**: Probar búsqueda por email, nombre, apellido
- [ ] **Filtros de suscripción**: 
  - [ ] Filtrar por "Activo"
  - [ ] Filtrar por "Trial"
  - [ ] Filtrar por "Cancelado"
  - [ ] Filtrar por "Sin suscripción"
- [ ] **Historial de suscripciones**: Verificar que se muestre el historial completo por usuario
- [ ] **Exportar a CSV**: Probar exportación de datos
- [ ] **Paginación**: Verificar que funcione con muchos usuarios

### Métricas del Dashboard
- [ ] **Total de usuarios**: Verificar que el contador sea correcto
- [ ] **MRR (Monthly Recurring Revenue)**: Verificar cálculo
- [ ] **Churn rate**: Verificar cálculo
- [ ] **Conversión trial → pago**: Verificar cálculo
- [ ] **LTV (Lifetime Value)**: Verificar cálculo

---

## 📧 Fase 2: Email Marketing Interno

### Configuración
- [ ] **Verificar Resend**: Comprobar que `RESEND_API_KEY` esté configurada
- [ ] **Verificar From Email**: Comprobar que `RESEND_FROM_EMAIL` esté configurada
- [ ] **Estado de configuración**: Verificar que `/admin/emails` muestre el estado correcto

### Emails Manuales
- [ ] **Enviar email de prueba**: Probar el botón "Send Test"
- [ ] **Enviar email masivo**: 
  - [ ] Seleccionar segmento "Todos"
  - [ ] Seleccionar segmento "Trial"
  - [ ] Seleccionar segmento "Activo"
  - [ ] Seleccionar segmento "Cancelado"
- [ ] **Validar contenido HTML**: Verificar que el HTML se renderice correctamente
- [ ] **Verificar recepción**: Confirmar que los emails lleguen a los destinatarios

### Secuencias Automatizadas
- [ ] **Email de bienvenida**: Probar trigger manual
- [ ] **Recordatorio de trial**: Probar trigger manual
- [ ] **Email de onboarding**: Probar trigger manual
- [ ] **Recuperación de cancelación**: Probar trigger manual
- [ ] **Re-engagement**: Probar trigger manual

### Automatizaciones de Email
- [ ] **Ejecutar automáticamente**: Verificar que se ejecuten en el momento correcto
- [ ] **No duplicados**: Verificar que no se envíen emails duplicados
- [ ] **Logs**: Verificar que se registren los envíos

---

## 🐝 Fase 3: Integración con Beehiiv

### Configuración
- [ ] **Verificar API Key**: Comprobar que `BEEHIIV_API_KEY` esté configurada
- [ ] **Verificar Publication ID**: Comprobar que `BEEHIIV_PUBLICATION_ID` esté configurada (con prefijo `pub_`)
- [ ] **Estado de configuración**: Verificar que `/admin/beehiiv` muestre el estado correcto

### Gestión Individual
- [ ] **Suscribir usuario**: Probar suscripción individual
- [ ] **Desuscribir usuario**: Probar desuscripción individual
- [ ] **Actualizar suscriptor**: Probar actualización de tags
- [ ] **Consultar suscriptor**: Verificar información del suscriptor

### Sincronización Masiva
- [ ] **Sincronizar todos los usuarios**: Probar sincronización completa
- [ ] **Sincronizar por segmento**:
  - [ ] Segmento "Todos"
  - [ ] Segmento "Trial"
  - [ ] Segmento "Activo"
  - [ ] Segmento "Cancelado"
- [ ] **Verificar resultados**: Confirmar usuarios exitosos y fallidos
- [ ] **Manejo de errores**: Verificar que los errores se muestren correctamente

### Automatización
- [ ] **Suscripción automática**: Verificar que nuevos usuarios se suscriban automáticamente
- [ ] **Tags automáticos**: Verificar que se agreguen tags `new-user` correctamente

---

## 🎨 Fase 4: Landing Pages

### Landing de Marketing
- [ ] **Acceso público**: Verificar que `/` sea accesible sin autenticación
- [ ] **Formulario de suscripción**: 
  - [ ] Probar suscripción con email válido
  - [ ] Validar email inválido
  - [ ] Verificar integración con Beehiiv
- [ ] **CTAs**: Verificar que los botones redirijan correctamente
- [ ] **Responsive**: Verificar en móvil, tablet y desktop

### Landing de Pricing
- [ ] **Acceso público**: Verificar que `/pricing` y `/planes` sean accesibles
- [ ] **Mostrar planes**: Verificar que se carguen desde la API
- [ ] **Toggle mensual/anual**: Probar cambio de precios
- [ ] **Checkout con Stripe**:
  - [ ] Probar checkout de plan mensual
  - [ ] Probar checkout de plan anual
  - [ ] Verificar redirección después del pago
- [ ] **FAQ**: Verificar que se muestre correctamente
- [ ] **Responsive**: Verificar en diferentes dispositivos

### Integración
- [ ] **Suscripción desde landing**: Verificar que se sincronice con Beehiiv
- [ ] **Redirección post-pago**: Verificar flujo completo

---

## 🤖 Fase 5: Automatizaciones Avanzadas

### Sistema de Eventos
- [ ] **Registro de eventos**: 
  - [ ] `course_completed`
  - [ ] `lesson_completed`
  - [ ] `course_started`
  - [ ] `onboarding_completed`
  - [ ] `subscription_created`
  - [ ] `subscription_cancelled`
  - [ ] `subscription_renewed`
- [ ] **Consulta de eventos**: Verificar que se puedan consultar por usuario
- [ ] **Historial de eventos**: Verificar que se almacene correctamente

### Segmentación Avanzada
- [ ] **Crear segmento**: Probar creación de nuevo segmento
- [ ] **Editar segmento**: Probar edición de reglas
- [ ] **Calcular usuarios**: 
  - [ ] Probar cálculo individual
  - [ ] Probar recálculo masivo
- [ ] **Reglas de segmentación**:
  - [ ] Por estado de suscripción
  - [ ] Por cursos completados
  - [ ] Por fecha de registro
  - [ ] Por inactividad
  - [ ] Por puntos/nivel
- [ ] **Usar segmento en automatización**: Verificar integración

### Automatizaciones
- [ ] **Crear automatización**: 
  - [ ] Trigger por evento
  - [ ] Trigger por programación (cron)
  - [ ] Trigger por segmento
- [ ] **Editar automatización**: Probar modificación
- [ ] **Activar/Desactivar**: Probar toggle de estado
- [ ] **Procesar manualmente**: Probar ejecución manual
- [ ] **Logs de ejecución**: Verificar que se registren correctamente
- [ ] **Acciones**:
  - [ ] Enviar email
  - [ ] Agregar tag en Beehiiv
  - [ ] Llamar webhook

### Analytics de Marketing
- [ ] **Conversiones**: Verificar cálculos de trial → pago
- [ ] **Engagement**: Verificar métricas de usuarios activos
- [ ] **Churn**: Verificar tasa de cancelación
- [ ] **Revenue**: Verificar MRR, ARR, revenue total
- [ ] **Eventos**: Verificar conteo de eventos

### Onboarding Personalizado
- [ ] **Completar onboarding**: Probar flujo completo
- [ ] **Recomendaciones personalizadas**:
  - [ ] Verificar que se generen después del onboarding
  - [ ] Verificar que se basen en respuestas
  - [ ] Verificar que eviten cursos completados
- [ ] **Página de recomendaciones**: 
  - [ ] Verificar acceso a `/recommendations`
  - [ ] Verificar que muestre cursos, guías y workshops
  - [ ] Verificar "Próximos pasos"
- [ ] **Redirección post-onboarding**: Verificar que redirija a recomendaciones

---

## 🔗 Integraciones Cruzadas

### Stripe
- [ ] **Checkout session**: Verificar creación correcta
- [ ] **Webhooks**: 
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] **Sincronización de suscripciones**: Verificar que se actualicen en la BD

### Base de Datos
- [ ] **Tablas creadas**: Verificar que todas las tablas existan:
  - [ ] `user_events`
  - [ ] `automations`
  - [ ] `automation_logs`
  - [ ] `user_segments`
  - [ ] `marketing_analytics`
- [ ] **Foreign keys**: Verificar integridad referencial
- [ ] **Índices**: Verificar que existan para performance

### Autenticación
- [ ] **Admin access**: Verificar que solo admins accedan a `/admin/*`
- [ ] **User access**: Verificar que usuarios normales no accedan a admin
- [ ] **Token validation**: Verificar que los tokens se validen correctamente

---

## 🚨 Casos de Error

### Manejo de Errores
- [ ] **API no disponible**: Verificar mensajes de error amigables
- [ ] **Datos inválidos**: Verificar validación de formularios
- [ ] **Permisos insuficientes**: Verificar mensajes de acceso denegado
- [ ] **Timeouts**: Verificar manejo de timeouts en requests largos

### Validación de Datos
- [ ] **Emails inválidos**: Verificar validación
- [ ] **Campos requeridos**: Verificar que se marquen correctamente
- [ ] **Límites de caracteres**: Verificar validación de límites

---

## 📊 Performance

- [ ] **Carga de dashboard**: Verificar que cargue en < 2 segundos
- [ ] **Cálculo de segmentos**: Verificar que no tome más de 5 segundos
- [ ] **Búsqueda de usuarios**: Verificar que sea rápida con muchos usuarios
- [ ] **Carga de recomendaciones**: Verificar que sea rápida

---

## 📱 Responsive Design

- [ ] **Admin dashboard**: Verificar en móvil, tablet, desktop
- [ ] **Landing pages**: Verificar en todos los dispositivos
- [ ] **Formularios**: Verificar que sean usables en móvil
- [ ] **Tablas**: Verificar que se adapten a pantallas pequeñas

---

## ✅ Checklist Final

- [ ] Todas las funcionalidades principales funcionan
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del servidor
- [ ] Todas las integraciones externas funcionan
- [ ] La documentación está actualizada
- [ ] Los datos de prueba se pueden limpiar fácilmente

