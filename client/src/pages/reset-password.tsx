import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { resetPasswordSchema, type ResetPasswordData } from "@shared/schema";
import { useLocation } from "wouter";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import LoginSidebar from "@/components/layout/login-sidebar";

export default function ResetPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    setToken(urlToken);

    if (!urlToken) {
      toast({
        title: "Token no encontrado",
        description: "El enlace de recuperación no es válido",
        variant: "destructive",
      });
    }
  }, [toast]);

  const form = useForm<ResetPasswordData & { confirmPassword: string }>({
    resolver: zodResolver(resetPasswordSchema.extend({
      confirmPassword: resetPasswordSchema.shape.password,
    })),
    defaultValues: {
      token: token || "",
      password: "",
      confirmPassword: "",
    },
  });

  // Update token in form when it's loaded
  useEffect(() => {
    if (token) {
      form.setValue('token', token);
    }
  }, [token, form]);

  const onSubmit = async (data: ResetPasswordData & { confirmPassword: string }) => {
    if (data.password !== data.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    try {
      // Importar Supabase client dinámicamente
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseAnonKey) {
        // Fallback al sistema legacy si Supabase no está configurado
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: data.token,
            password: data.password,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setIsSuccess(true);
          toast({
            title: "Contraseña restablecida",
            description: result.message,
          });
        } else {
          toast({
            title: "Error",
            description: result.message || "Error al restablecer la contraseña",
            variant: "destructive",
          });
        }
        return;
      }

      // Usar Supabase para actualizar la contraseña
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Error al restablecer la contraseña",
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Contraseña restablecida",
          description: "Tu contraseña ha sido actualizada correctamente",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar al servidor",
        variant: "destructive",
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <LoginSidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">¡Contraseña restablecida!</h1>
              <p className="text-muted-foreground mb-6">
                Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
              </p>
              <Button
                onClick={() => setLocation('/login')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Ir al login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <LoginSidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Token no válido</h1>
              <p className="text-muted-foreground mb-6">
                El enlace de recuperación no es válido o ha expirado.
              </p>
              <Button
                onClick={() => setLocation('/forgot-password')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Solicitar nuevo enlace
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <LoginSidebar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg p-8">
            <h1 className="text-2xl font-bold mb-2">Restablecer contraseña</h1>
            <p className="text-muted-foreground mb-6">
              Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="bg-input border-border text-foreground pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar nueva contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="bg-input border-border text-foreground pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Restableciendo..." : "Restablecer contraseña"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

