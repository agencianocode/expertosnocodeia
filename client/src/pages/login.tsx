import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Shield, Chrome } from "lucide-react";
import { loginSchema, registerSchema, type LoginData, type RegisterData } from "@shared/schema";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useLocation } from "wouter";
import LoginSidebar from "@/components/layout/login-sidebar";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  
  // Use simple auth system
  const { isAuthenticated, login } = useSimpleAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  // Login form
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const handleLogin = async (data: LoginData) => {
    try {
      await login(data.email, data.password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleRegister = (data: RegisterData) => {
    // Registration not implemented in SimpleAuth yet
    console.log('Registration not yet implemented');
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = "/api/auth/google";
  };

  const handleReplitLogin = () => {
    // Fallback to Replit Auth
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <LoginSidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto lg:ml-[250px] flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {isLogin ? "Bienvenido de nuevo" : "Únete a nosotros"}
              </h1>
              <p className="text-muted-foreground">
                {isLogin ? "Inicia sesión en tu cuenta" : "Crea tu cuenta gratuita"}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
              {/* Tab Navigation */}
              <div className="flex rounded-lg bg-muted p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
                    isLogin
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="tab-login"
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
                    !isLogin
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="tab-register"
                >
                  Crear cuenta
                </button>
              </div>

              {/* Login Form */}
              {isLogin && (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
                        <span>🔐</span>
                        <span>Accede a tu cuenta</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-6">
                        Ingresa tus credenciales para continuar
                      </p>
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección de correo electrónico</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="tu@ejemplo.com"
                                  className="pr-10"
                                  data-testid="input-email"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                  <span className="w-5 h-5 bg-muted rounded-full flex items-center justify-center">
                                    <span className="text-xs">@</span>
                                  </span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>Contraseña</FormLabel>
                              <button
                                type="button"
                                className="text-xs text-muted-foreground hover:text-foreground"
                                data-testid="link-forgot-password"
                              >
                                ¿Has olvidado tu contraseña?
                              </button>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className="pr-10"
                                  data-testid="input-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                                  data-testid="button-toggle-password"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors"
                      disabled={false}
                      data-testid="button-login"
                    >
                      Iniciar sesión
                    </Button>
                  </form>
                </Form>
              )}

              {/* Register Form */}
              {!isLogin && (
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
                        <span>👋</span>
                        <span>Crea tu cuenta</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-6">
                        Únete a miles de expertos NoCode
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Juan"
                                  data-testid="input-firstname"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Apellido</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Pérez"
                                  data-testid="input-lastname"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección de correo electrónico</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="tu@ejemplo.com"
                                  className="pr-10"
                                  data-testid="input-register-email"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                  <span className="w-5 h-5 bg-muted rounded-full flex items-center justify-center">
                                    <span className="text-xs">@</span>
                                  </span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className="pr-10"
                                  data-testid="input-register-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                                  data-testid="button-toggle-register-password"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors"
                      disabled={false}
                      data-testid="button-register"
                    >
                      Crear cuenta
                    </Button>
                  </form>
                </Form>
              )}

              {/* Social Login Options */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">o continúa con</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-border rounded-lg shadow-sm bg-background text-foreground hover:bg-muted transition-colors"
                    data-testid="button-google-login"
                  >
                    <Chrome className="h-5 w-5 mr-2" />
                    Continuar con Google
                  </button>

                  <button
                    type="button"
                    onClick={handleReplitLogin}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-border rounded-lg shadow-sm bg-background text-foreground hover:bg-muted transition-colors"
                    data-testid="button-replit-login"
                  >
                    <Shield className="h-5 w-5 mr-2" />
                    Continuar con Replit
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Al crear una cuenta, aceptas nuestros{" "}
                  <a href="/terminos" className="font-medium text-primary hover:text-primary/80">
                    Términos de Servicio
                  </a>{" "}
                  y{" "}
                  <a href="/privacidad" className="font-medium text-primary hover:text-primary/80">
                    Política de Privacidad
                  </a>
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                <Shield className="w-3 h-3" />
                <span>Protegido por seguridad de nivel empresarial</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}