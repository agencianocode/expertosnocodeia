import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Setup() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const createAdminMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/setup/first-admin', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Error al crear administrador';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Response was not JSON:', text);
          errorMessage = `Error del servidor: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setIsSuccess(true);
      toast({
        title: "¡Éxito!",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold text-white">Acceso Requerido</h1>
        <p className="text-gray-400">Debes iniciar sesión para acceder a la configuración.</p>
        <a href="/api/login">
          <Button>Iniciar Sesión</Button>
        </a>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white">¡Configuración Completada!</CardTitle>
            <CardDescription className="text-gray-400">
              Tu cuenta ha sido promocionada a Super Administrador exitosamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-300">
              Ahora tienes acceso completo al panel de administración donde podrás:
            </p>
            <ul className="text-left text-gray-400 space-y-2 max-w-md mx-auto">
              <li>• Crear y gestionar cursos</li>
              <li>• Administrar categorías y contenido</li>
              <li>• Subir archivos multimedia</li>
              <li>• Gestionar otros usuarios administradores</li>
              <li>• Configurar plantillas de cursos</li>
            </ul>
            <div className="pt-6 space-x-4">
              <Link href="/admin/dashboard">
                <Button>
                  <Shield className="h-4 w-4 mr-2" />
                  Panel de Administración
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Ver Plataforma</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-purple-400" />
          </div>
          <CardTitle className="text-2xl text-white">Configuración Inicial</CardTitle>
          <CardDescription className="text-gray-400">
            Configura tu cuenta como el primer administrador del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <h3 className="text-yellow-400 font-medium">Información Importante</h3>
                <p className="text-yellow-300/80 text-sm mt-1">
                  Este proceso creará la primera cuenta de administrador del sistema. 
                  Solo puede ejecutarse una vez y únicamente en entorno de desarrollo.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-medium">Como administrador podrás:</h3>
            <ul className="text-gray-400 space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                Crear y gestionar todos los cursos
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                Administrar categorías y contenido
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                Subir y gestionar archivos multimedia
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                Crear otros usuarios administradores
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                Acceder a todas las configuraciones del sistema
              </li>
            </ul>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <div className="text-center space-y-4">
              <p className="text-gray-300">
                Usuario actual: <span className="text-white font-medium">{(user as any)?.email || 'Usuario'}</span>
              </p>
              <Button
                onClick={() => createAdminMutation.mutate()}
                disabled={createAdminMutation.isPending}
                size="lg"
                className="w-full"
              >
                {createAdminMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Configurando...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Convertirme en Administrador
                  </>
                )}
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Cancelar y Volver
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}