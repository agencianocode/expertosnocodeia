# Sistema de Roles y Permisos

## Roles de Usuario (tabla `users.role`)

### 1. `user` (Por defecto)
- **Descripción**: Usuario básico sin suscripción activa
- **Asignación**: Automática al registrarse
- **Permisos**:
  - Acceso a contenido gratuito
  - Ver cursos, guías y talleres públicos
  - Participar en comunidad (si email verificado)
  - Comentar en lecciones (si email verificado)

### 2. `paid_user`
- **Descripción**: Usuario con suscripción activa
- **Asignación**: Automática cuando se crea/activa una suscripción
- **Actualización**: Se actualiza automáticamente cuando:
  - Se crea una suscripción activa
  - Se cancela una suscripción (vuelve a `user`)
  - Cambia el estado de la suscripción
- **Permisos**:
  - Todos los permisos de `user`
  - Acceso completo a todos los cursos
  - Acceso a 300+ guías
  - Participación en workshops en vivo
  - Certificados de finalización
  - Comunidad privada exclusiva
  - Descuentos en herramientas

### 3. `instructor` (Futuro)
- **Descripción**: Instructor de cursos y workshops
- **Asignación**: Manual por administrador
- **Permisos**:
  - Todos los permisos de `paid_user`
  - Crear y editar cursos propios
  - Crear y editar workshops propios
  - Gestionar estudiantes de sus cursos

### 4. `moderator` (Futuro)
- **Descripción**: Moderador de la comunidad
- **Asignación**: Manual por administrador
- **Permisos**:
  - Todos los permisos de `paid_user`
  - Moderar comentarios y posts
  - Eliminar contenido inapropiado
  - Gestionar reportes de la comunidad

## Roles Administrativos (tabla `adminUsers`)

### 1. `admin`
- **Descripción**: Administrador estándar
- **Asignación**: Manual en tabla `adminUsers`
- **Permisos**:
  - Acceso al panel de administración
  - Gestionar contenido (cursos, guías, talleres)
  - Gestionar usuarios
  - Ver analytics
  - Gestionar comentarios
  - Gestionar comunidad

### 2. `editor`
- **Descripción**: Editor de contenido
- **Asignación**: Manual en tabla `adminUsers`
- **Permisos**:
  - Crear y editar contenido
  - Publicar/despublicar contenido
  - Gestionar categorías
  - Ver analytics de contenido
  - **NO puede**: Gestionar usuarios, cambiar configuraciones del sistema

### 3. `super_admin`
- **Descripción**: Super administrador con todos los permisos
- **Asignación**: Manual en tabla `adminUsers`
- **Permisos**:
  - Todos los permisos de `admin`
  - Gestionar otros administradores
  - Configuraciones del sistema
  - Acceso a todas las funcionalidades sin restricciones

## Flujo de Asignación de Roles

### Al Registrarse
1. Usuario se registra → Rol: `user` (automático)
2. Email verificado → Puede comentar y participar
3. Si compra suscripción → Rol: `paid_user` (automático)

### Actualización Automática de Roles
- **Cuando se crea una suscripción activa**: `user` → `paid_user`
- **Cuando se cancela una suscripción**: `paid_user` → `user`
- **Cuando expira una suscripción**: `paid_user` → `user`

### Asignación Manual
- **Roles administrativos**: Se asignan manualmente en la tabla `adminUsers`
- **Roles especiales** (`instructor`, `moderator`): Se asignan manualmente actualizando `users.role`

## Verificación de Roles

### En el Backend
```typescript
// Verificar si es usuario de pago
const user = await storage.getUser(userId);
const isPaidUser = user.role === 'paid_user';

// Verificar si es admin
const adminUser = await storage.getAdminUser(userId);
const isAdmin = !!adminUser && adminUser.isActive;
```

### En el Frontend
```typescript
// Verificar rol del usuario
const { user } = useSimpleAuth();
const isPaidUser = user?.role === 'paid_user';
const isAdmin = user?.isAdmin; // Viene del hook useAdmin
```

## Migración de Roles Existentes

Los usuarios existentes se actualizarán automáticamente:
- Si tienen suscripción activa → `paid_user`
- Si no tienen suscripción → `user`

## Notas Importantes

1. **Roles administrativos** (`admin`, `editor`, `super_admin`) se gestionan en `adminUsers`, no en `users.role`
2. **El rol `paid_user`** se actualiza automáticamente basado en suscripciones activas
3. **No se debe** asignar manualmente `paid_user` - se gestiona automáticamente
4. **Los roles especiales** (`instructor`, `moderator`) se pueden asignar manualmente cuando sea necesario

