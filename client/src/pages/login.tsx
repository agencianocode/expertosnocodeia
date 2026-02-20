import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Shield, Chrome, Mail, Key, ChevronDown, Lock } from "lucide-react";
import { loginSchema, registerSchema, type LoginData, type RegisterData } from "@shared/schema";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import LoginSidebar from "@/components/layout/login-sidebar";
import universidadLogo from "@/assets/universidad-logo.png";
import { getSavedEmails, type SavedEmail } from "@/lib/email-storage";

export default function Login() {
  const [location] = useLocation();
  // Check if we're on register/inscribirse route
  const isRegisterRoute = location === '/register' || location === '/inscribirse';
  const registerIntent = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('intent') : null;
  const [isLogin, setIsLogin] = useState(!isRegisterRoute);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Use simple auth system
  const { isAuthenticated, login, register, isLoading: authLoading } = useSimpleAuth();
  
  // Email suggestions state
  const [savedEmails, setSavedEmails] = useState<SavedEmail[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [emailInputFocused, setEmailInputFocused] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update isLogin state when route changes
  useEffect(() => {
    setIsLogin(!isRegisterRoute);
  }, [location, isRegisterRoute]);

  // Load saved emails
  useEffect(() => {
    const emails = getSavedEmails();
    setSavedEmails(emails);
  }, []);

  // Show error from Google OAuth (or other) when redirected with ?error=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (!error) return;
    const messages: Record<string, string> = {
      google_auth_failed: 'No se pudo completar el acceso con Google. Vuelve a intentarlo.',
      google_not_configured: 'El acceso con Google no está configurado en el servidor.',
      token_exchange_failed: 'Error al verificar la sesión con Google. Intenta de nuevo.',
      user_info_failed: 'No se pudo obtener tu información de Google.',
      google_auth_error: 'Error al registrar o iniciar sesión con Google. Intenta de nuevo o usa email y contraseña.',
    };
    const description = messages[error] || 'Ha ocurrido un error. Vuelve a intentarlo.';
    toast({
      title: 'Error con Google',
      description,
      variant: 'destructive',
    });
    // Remove error from URL so it doesn't show again on refresh
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [toast]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        emailInputRef.current &&
        !emailInputRef.current.contains(event.target as Node)
      ) {
        setShowEmailSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Redirect if already authenticated
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     setLocation("/");
  //   }
  // }, [isAuthenticated, setLocation]);

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
    console.log('🔐 handleLogin called with:', { email: data.email, hasPassword: !!data.password });
    try {
      console.log('🔐 Calling login function...');
      await login(data.email, data.password);
      console.log('🔐 Login function completed');
    } catch (error) {
      console.error('❌ Login failed:', error);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    // Validate password confirmation
    if (data.password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    try {
      await register(data.email, data.password, data.firstName || '', data.lastName || '');
      // Success is handled by the register function (toast + redirect)
    } catch (error: any) {
      console.error('Registration failed:', error);
      // Error is already handled by the register function's toast
    }
  };

  const handleGoogleLogin = () => {
    // Use backend OAuth endpoint directly
    window.location.href = "/api/auth/google";
  };

  const handleReplitLogin = () => {
    // Fallback to Replit Auth
    window.location.href = "/api/login";
  };

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

            {/* Welcome Message */}
            {isLogin ? (
              <div className="text-center mb-6">
                <h1 className="font-bold text-foreground mb-2" style={{ fontSize: '30px' }}>
                  ¡Bienvenido de nuevo!
                </h1>
                <p className="text-muted-foreground text-sm">
                  Introduce tus datos
                </p>
              </div>
            ) : (
              <div className="mb-6 text-center">
                <h1 className="font-bold text-foreground mb-2" style={{ fontSize: '30px' }}>
                  {registerIntent === 'trial' ? 'Empezar prueba gratuita' : 'Inscribirse'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {registerIntent === 'trial'
                    ? 'Crea tu cuenta para comenzar tu prueba de 14 días. No necesitas tarjeta.'
                    : 'Únete a Universidad Expertos NoCode IA y comienza a aprender hoy mismo'}
                </p>
              </div>
            )}

            <div className="bg-card border border-border rounded-lg p-8 shadow-lg">

              {/* Login Form */}
              {isLogin && (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground text-sm mb-2 block">
                              Dirección de correo electrónico
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                                <Input
                                  {...field}
                                  ref={emailInputRef}
                                  type="email"
                                  placeholder="soporte.agenciadenocode@gmail.com"
                                  className="pl-10 pr-4 bg-input border-border text-foreground rounded-lg h-12"
                                  data-testid="input-email"
                                  onFocus={() => {
                                    setEmailInputFocused(true);
                                    if (savedEmails.length > 0) {
                                      setShowEmailSuggestions(true);
                                    }
                                  }}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value.length > 0) {
                                      setShowEmailSuggestions(false);
                                    } else if (savedEmails.length > 0) {
                                      setShowEmailSuggestions(true);
                                    }
                                  }}
                                />
                                {/* Email Suggestions Dropdown */}
                                {showEmailSuggestions && savedEmails.length > 0 && emailInputFocused && (
                                  <div
                                    ref={suggestionsRef}
                                    className="absolute z-50 w-full mt-1 bg-input border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                                  >
                                    {savedEmails.map((savedEmail, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                          field.onChange(savedEmail.email);
                                          setShowEmailSuggestions(false);
                                          emailInputRef.current?.focus();
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 border-b border-border last:border-b-0"
                                      >
                                        <div className="flex-shrink-0">
                                          {savedEmail.provider === 'google' ? (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                                              <span className="text-foreground text-xs font-bold">G</span>
                                            </div>
                                          ) : (
                                            <Mail className="h-5 w-5 text-muted-foreground" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          {savedEmail.name && (
                                            <div className="text-foreground text-sm font-medium truncate">
                                              {savedEmail.name}
                                            </div>
                                          )}
                                          <div className="text-muted-foreground text-sm truncate">
                                            {savedEmail.email}
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
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
                            <FormLabel className="text-foreground text-sm mb-2 block">
                              Contraseña
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className="pl-10 pr-12 bg-input border-border text-foreground rounded-lg h-12"
                                  data-testid="input-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  data-testid="button-toggle-password"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-foreground font-semibold py-3 px-4 rounded-lg transition-colors uppercase"
                      disabled={false}
                      data-testid="button-login"
                    >
                      Iniciar sesión
                    </Button>

                    <button
                      type="button"
                      className="w-full text-foreground text-xs uppercase underline hover:no-underline"
                      data-testid="link-forgot-password"
                      onClick={() => setLocation('/forgot-password')}
                    >
                      Has olvidado tu contraseña
                    </button>
                  </form>
                </Form>
              )}

              {/* Register Form */}
              {!isLogin && (
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={registerForm.control}
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
                                  placeholder="Introduce tu correo electrónico"
                                  className="pl-10 pr-4 bg-input border-border text-foreground rounded-lg h-12"
                                  data-testid="input-register-email"
                                />
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
                            <FormLabel className="text-foreground text-sm mb-2 block">Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Crear una contraseña"
                                  className="pl-10 pr-12 bg-input border-border text-foreground rounded-lg h-12"
                                  data-testid="input-register-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  data-testid="button-toggle-register-password"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">La contraseña debe tener al menos 8 caracteres.</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormItem>
                        <FormLabel className="text-foreground text-sm mb-2 block">Confirmar Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirma tu contraseña"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="pl-10 pr-12 bg-input border-border text-foreground rounded-lg h-12"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        {confirmPassword && registerForm.watch("password") !== confirmPassword && (
                          <p className="text-xs text-red-400 mt-1">Las contraseñas no coinciden</p>
                        )}
                      </FormItem>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      disabled={authLoading}
                      data-testid="button-register"
                    >
                      {authLoading ? (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                          Inscribiendo...
                        </>
                      ) : (
                        <>
                          <Shield className="h-5 w-5" />
                          Inscribirse
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}

              {/* Separator for Register */}
              {!isLogin && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-card text-muted-foreground uppercase">O Continuar con</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Google Login Option for Register */}
              {!isLogin && (
                <div className="mt-6">
                  {(() => {
                    const googleEmails = savedEmails.filter(e => e.provider === 'google');
                    const firstGoogleEmail = googleEmails[0];
                    
                    return (
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full inline-flex justify-between items-center px-4 py-3 border border-border rounded-lg bg-white text-gray-900 hover:bg-gray-50 transition-colors"
                        data-testid="button-google-register"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-foreground text-xs font-bold">U</span>
                          </div>
                          <div className="text-left">
                            {firstGoogleEmail ? (
                              <>
                                <div className="text-sm font-medium">
                                  {firstGoogleEmail.name ? `Acceder como ${firstGoogleEmail.name.split(' ')[0]}` : 'Acceder con Google'}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  {firstGoogleEmail.email}
                                  {googleEmails.length > 1 && <ChevronDown className="h-3 w-3" />}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-sm font-medium">Continuar con Google</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  Registrarse con tu cuenta de Google
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <img 
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                            alt="Google" 
                            className="h-5 w-5"
                          />
                        </div>
                      </button>
                    );
                  })()}
                </div>
              )}

              {/* Sign Up Link for Register */}
              {!isLogin && (
                <div className="mt-6 text-center">
                  <p className="text-foreground text-sm">
                    ¿Ya tienes una cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="text-orange-500 underline hover:no-underline font-medium"
                    >
                      Iniciar sesión
                    </button>
                  </p>
                </div>
              )}

              {/* Terms and Privacy for Register */}
              {!isLogin && (
                <div className="mt-8 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Este sitio está protegido por reCAPTCHA y se aplican las políticas de privacidad de Google.
                  </p>
                  <div className="flex justify-center gap-4 text-xs">
                    <a href="/politica-privacidad" className="text-orange-500 underline hover:no-underline">
                      Política de privacidad
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a href="/condiciones-servicio" className="text-orange-500 underline hover:no-underline">
                      Condiciones de servicio
                    </a>
                  </div>
                </div>
              )}

              {/* Google Login Option */}
              {isLogin && (
                <div className="mt-6">
                  {(() => {
                    const googleEmails = savedEmails.filter(e => e.provider === 'google');
                    const firstGoogleEmail = googleEmails[0];
                    
                    return (
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full inline-flex justify-between items-center px-4 py-3 border border-border rounded-lg bg-white text-gray-900 hover:bg-gray-50 transition-colors"
                        data-testid="button-google-login"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-foreground text-xs font-bold">U</span>
                          </div>
                          <div className="text-left">
                            {firstGoogleEmail ? (
                              <>
                                <div className="text-sm font-medium">
                                  {firstGoogleEmail.name ? `Acceder como ${firstGoogleEmail.name.split(' ')[0]}` : 'Acceder con Google'}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  {firstGoogleEmail.email}
                                  {googleEmails.length > 1 && <ChevronDown className="h-3 w-3" />}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-sm font-medium">Continuar con Google</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  Iniciar sesión con tu cuenta de Google
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <img 
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                            alt="Google" 
                            className="h-5 w-5"
                          />
                        </div>
                      </button>
                    );
                  })()}
                </div>
              )}

              {/* Sign Up Link */}
              {isLogin && (
                <div className="mt-6 text-center">
                  <p className="text-foreground text-sm">
                    ¿No tienes una cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="text-blue-500 underline hover:no-underline font-medium"
                    >
                      Inscribirse
                    </button>
                  </p>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}