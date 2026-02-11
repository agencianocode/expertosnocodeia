# 📅 Guía Completa para Crear Eventos

## ✅ Sistema de Eventos Implementado

Tu plataforma ahora tiene un sistema completo de eventos en vivo con:
- ✅ Subida de imágenes a Supabase Storage
- ✅ Modal profesional con diseño como The Rundown AI
- ✅ Página de detalles completa
- ✅ Sistema de registro (RSVP)
- ✅ Confirmación por email
- ✅ Exportar a calendario (.ics)

---

## 🎯 **Cómo Crear un Evento**

### **Paso 1: Acceder al Panel de Admin**

Ve a: **http://localhost:5000/admin/live-events**

### **Paso 2: Hacer Clic en "Nuevo Evento"**

Verás un botón azul en la parte superior derecha: **"+ Nuevo Evento"**

### **Paso 3: Completar el Formulario**

#### **Campos Obligatorios (*):**

1. **Título del evento** *
   - Ejemplo: `Nano Banana Pro para presentaciones`

2. **Descripción**
   - Ejemplo: 
   ```
   La mayoría de los modelos de imagen han tenido problemas de consistencia, 
   texto desordenado, detalles omitidos y un estilo que cambia de diapositiva 
   en diapositiva. Nano Banana Pro cambia eso. Sigue las instrucciones, mantiene 
   un lenguaje de diseño coherente y maneja información real sin fallos.
   ```

3. **Anfitrión** *
   - Ejemplo: `Fabian Segura`

4. **Rol del anfitrión**
   - Ejemplo: `Founder`, `CEO`, `Experto en IA`

5. **Avatar del anfitrión**
   - Haz clic en **"Subir avatar"**
   - Selecciona una foto (recomendado: 200x200px, formato cuadrado)
   - Se sube automáticamente a Supabase Storage
   - Verás un preview circular

6. **Imagen del evento**
   - Haz clic en **"Subir imagen"**
   - Selecciona un banner (recomendado: 1200x600px, horizontal)
   - Se sube automáticamente a Supabase Storage
   - Verás un preview rectangular

7. **Fecha y hora inicio** *
   - Ejemplo: `05/12/2025 04:00 PM`
   - Usa el selector de fecha y hora

8. **Fecha y hora fin** *
   - Ejemplo: `05/12/2025 05:00 PM`
   - Debe ser después de la hora de inicio

9. **Tipo de evento**
   - Opciones:
     - `Live / Transmisión`
     - `Taller / Workshop` ✅ (recomendado)
     - `Webinar`
     - `Q&A / Preguntas`

### **Paso 4: Guardar**

Haz clic en **"Crear Evento"**

---

## 📊 **Especificaciones de Imágenes**

### **Avatar del Anfitrión:**
- **Formato:** JPG, PNG, WEBP
- **Tamaño recomendado:** 200x200px (cuadrado)
- **Peso máximo:** 5MB
- **Aspecto:** 1:1 (cuadrado)
- **Uso:** Se muestra en círculo en el modal y página de detalles

### **Imagen del Evento:**
- **Formato:** JPG, PNG, WEBP
- **Tamaño recomendado:** 1200x600px (horizontal)
- **Peso máximo:** 5MB
- **Aspecto:** 2:1 (horizontal)
- **Uso:** Banner en el modal del calendario

---

## 🔄 **Flujo del Usuario (Vista Pública)**

### **1. Usuario ve el calendario** (`/events`)
```
→ Calendario con eventos del mes
→ Clic en un evento
→ Se abre POPUP modal
```

### **2. Modal del Evento (Popup)**
```
✅ Hero banner con imagen del evento (si existe)
✅ Badge del tipo (ej: "Workshop")
✅ Título del evento
✅ "Presentado por [Host]"
✅ Avatar del host (círculo grande)
✅ Fecha y hora
✅ Descripción
✅ Botón "Ver detalles del evento"
```

### **3. Página de Detalles** (`/calendar-events/:eventId`)
```
✅ Hero banner completo
✅ Sidebar lateral con información
✅ Detalles completos del taller
✅ Botón "RSVP para este evento" (azul)
```

### **4. Después del Registro**
```
✅ Email de confirmación enviado
✅ Botón cambia a "RSVP confirmada" (verde)
✅ Aparecen botones adicionales:
   - "Añadir al calendario" (descarga .ics)
   - "Únase a la transmisión en vivo"
✅ Contador: "71 en marcha"
```

---

## 🎨 **Diseño Visual del Modal**

El modal ahora tiene un diseño profesional similar a The Rundown AI:

**Hero Section (Negro):**
- Imagen del evento de fondo con overlay oscuro
- Badge del tipo de evento flotante
- Logo/icono de la plataforma
- Título en blanco grande
- Host y avatar destacados

**Content Section:**
- Fecha y hora en formato elegante
- Descripción del evento
- Botón de acción principal

---

## 🔧 **Endpoints Creados**

### **Upload de Imágenes:**
```
POST /api/admin/events/upload-image
```
- Sube imagen a Supabase Storage
- Retorna URL pública
- Requiere autenticación admin

### **Gestión de Eventos:**
```
GET    /api/admin/live-events      - Listar todos
POST   /api/admin/live-events      - Crear evento
PATCH  /api/admin/live-events/:id  - Editar evento
DELETE /api/admin/live-events/:id  - Eliminar evento
POST   /api/admin/live-events/:id/toggle-live - Activar/desactivar live
```

### **Eventos Públicos:**
```
GET /api/events           - Listar eventos (calendario)
GET /api/events/:id       - Obtener detalles de un evento
GET /api/events/:id/registration-status - Ver si estás registrado
POST /api/events/:id/register - Registrarse en evento
```

---

## 🚀 **Prueba el Sistema Ahora:**

### **1. Crear Evento:**
- Ve a: http://localhost:5000/admin/live-events
- Haz clic en **"+ Nuevo Evento"**
- Completa el formulario
- Sube avatar e imagen
- Guarda

### **2. Ver en el Calendario:**
- Ve a: http://localhost:5000/events
- Busca el evento en la fecha que configuraste
- Haz clic en el evento

### **3. Ver el Modal:**
- ✅ Debe mostrar la imagen del evento como fondo
- ✅ Avatar del host en círculo
- ✅ Diseño profesional

### **4. Ver Detalles Completos:**
- Haz clic en "Ver detalles del evento"
- Verás la página completa con sidebar
- Botón "RSVP para este evento"

---

## 💾 **Almacenamiento**

**Bucket de Supabase:** `attached-assets`

**Rutas de archivos:**
- Imágenes de eventos: `events/event-{timestamp}.{ext}`
- Avatares: `events/event-{timestamp}.{ext}`

**URLs Públicas:**
- Se generan automáticamente
- Accesibles sin autenticación
- Formato: `https://tu-proyecto.supabase.co/storage/v1/object/public/attached-assets/events/...`

---

## ✅ **Estado Actual:**

| Componente | Estado |
|------------|--------|
| **Servidor** | ✅ Corriendo en puerto 5000 |
| **Columna event_image** | ✅ Agregada a la BD |
| **Upload endpoint** | ✅ Funcionando |
| **Formularios admin** | ✅ Con subida de archivos |
| **Modal de eventos** | ✅ Diseño profesional |
| **Sistema RSVP** | ✅ Funcionando |

---

**Fecha de implementación**: 3 de diciembre de 2025  
**Sistema listo para usar**: ✅ SÍ

