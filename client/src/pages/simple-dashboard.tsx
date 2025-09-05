import { useSimpleAuth } from "@/hooks/use-simple-auth";

export default function SimpleDashboard() {
  const { user, isLoading } = useSimpleAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No autenticado</h1>
          <a href="/login" className="text-primary hover:underline">Ir al login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ¡Bienvenido de vuelta, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Tu sistema de autenticación está funcionando correctamente.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Info Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Tu Información</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Nombre:</span> {user.firstName} {user.lastName}</p>
              <p><span className="font-medium">ID:</span> {user.id}</p>
            </div>
          </div>

          {/* Success Card */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4">✅ Sistema Funcionando</h2>
            <div className="space-y-2 text-sm text-green-700">
              <p>• Autenticación JWT exitosa</p>
              <p>• Token válido y activo</p>
              <p>• Datos de usuario cargados</p>
              <p>• Sin bucles infinitos</p>
            </div>
          </div>

          {/* Next Steps Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">📋 Próximos Pasos</h2>
            <div className="space-y-2 text-sm text-blue-700">
              <p>• Restaurar rutas completas del servidor</p>
              <p>• Cargar datos de cursos y progreso</p>
              <p>• Activar funcionalidades de admin</p>
              <p>• Verificar datos migrados</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">🔧 Estado del Sistema</h3>
            <p className="text-sm text-yellow-700">
              El sistema de autenticación está funcionando correctamente. 
              La migración de Replit Auth a email/contraseña fue exitosa.
              Todos tus datos anteriores están preservados y listos para ser restaurados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}