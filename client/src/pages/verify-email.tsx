import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Mail } from "lucide-react";
import LoginSidebar from "@/components/layout/login-sidebar";

export default function VerifyEmail() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    setToken(urlToken);

    if (!urlToken) {
      setError("Token de verificación no encontrado");
      setIsVerifying(false);
      return;
    }

    // Verify email with token
    verifyEmail(urlToken);
  }, []);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsVerified(true);
        toast({
          title: "Email verificado",
          description: result.message,
        });
      } else {
        setError(result.message || "Error al verificar el email");
        toast({
          title: "Error",
          description: result.message || "Error al verificar el email",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setError("Error de conexión");
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar al servidor",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex">
        <LoginSidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Verificando email...</h1>
              <p className="text-gray-400">
                Por favor espera mientras verificamos tu email.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex">
        <LoginSidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">¡Email verificado!</h1>
              <p className="text-gray-400 mb-6">
                Tu email ha sido verificado exitosamente. Ya puedes usar todas las funcionalidades de la plataforma.
              </p>
              <Button
                onClick={() => setLocation('/dashboard')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Ir al Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white flex">
      <LoginSidebar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Error de verificación</h1>
            <p className="text-gray-400 mb-6">
              {error || "El token de verificación no es válido o ha expirado."}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setLocation('/login')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Ir al login
              </Button>
              <Button
                onClick={() => setLocation('/profile')}
                variant="outline"
                className="w-full border-dark-border text-gray-300 hover:bg-dark-bg"
              >
                Reenviar email de verificación
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

