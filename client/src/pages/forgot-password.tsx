import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { forgotPasswordSchema, type ForgotPasswordData } from "@shared/schema";
import { useLocation } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";
import LoginSidebar from "@/components/layout/login-sidebar";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Email enviado",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Error al enviar el email",
          variant: "destructive",
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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden lg:block">
            <LoginSidebar />
          </div>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto lg:ml-[250px] flex items-center justify-center p-8">
            <div className="w-full max-w-md space-y-6">
              {/* Header Banner */}
              <div className="flex justify-center mb-6">
                <div className="px-8 py-4 rounded-lg bg-card">
                  <h1 className="font-bold text-xl md:text-2xl text-center">
                    <span className="bg-gradient-to-r from-purple-accent to-blue-accent bg-clip-text text-transparent">Universidad</span>
                    <span className="text-foreground"> Expertos NoCode IA</span>
                  </h1>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-8 shadow-lg text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-foreground">Email enviado</h1>
                <p className="text-muted-foreground mb-6">
                  Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Revisa tu bandeja de entrada y la carpeta de spam. El enlace expirará en 1 hora.
                </p>
                <Button
                  onClick={() => setLocation('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-foreground font-semibold py-3 px-4 rounded-lg transition-colors uppercase"
                >
                  Volver al inicio de sesión
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <LoginSidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto lg:ml-[250px] flex items-center justify-center p-8 relative">
          {/* Back Button - Top Left */}
          <Button
            variant="ghost"
            onClick={() => setLocation('/login')}
            className="absolute top-8 left-8 text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="w-full max-w-md space-y-6">
            {/* Header Banner */}
            <div className="flex justify-center mb-6">
              <div 
                className="px-8 py-4 rounded-lg"
                className="bg-card"
              >
                <h1 className="font-bold text-xl md:text-2xl text-center">
                  <span className="bg-gradient-to-r from-purple-accent to-blue-accent bg-clip-text text-transparent">Universidad</span>
                  <span className="text-foreground"> Expertos NoCode IA</span>
                </h1>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="font-bold text-foreground mb-2" style={{ fontSize: '30px' }}>
                Restablecer su contraseña
              </h1>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground text-sm mb-2 block">
                          Dirección de correo electrónico
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="nombre@ejemplo.com"
                              className="pl-10 pr-4 bg-input border-border text-foreground rounded-lg h-12"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-foreground font-semibold py-3 px-4 rounded-lg transition-colors uppercase"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Enviando..." : "Enviar enlace de restablecimiento"}
                  </Button>
                </form>
              </Form>

              <button
                type="button"
                onClick={() => setLocation('/login')}
                className="w-full mt-6 text-foreground text-xs uppercase underline hover:no-underline text-center"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

