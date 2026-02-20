import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { saveEmail } from "@/lib/email-storage";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Initialize from localStorage or URL params (for OAuth redirects)
  useEffect(() => {
    // Check URL for token (from Google OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      setToken(urlToken);
      localStorage.setItem('simpleAuthToken', urlToken);
      fetchUser(urlToken);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedToken = localStorage.getItem('simpleAuthToken');
      if (storedToken) {
        setToken(storedToken);
        fetchUser(storedToken);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    console.log('🔍 fetchUser called with token:', authToken ? 'Token exists' : 'NO TOKEN');
    try {
      console.log('🔍 Fetching /api/auth/me...');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      console.log('🔍 /api/auth/me response status:', response.status);
      console.log('🔍 /api/auth/me response ok:', response.ok);

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User data received:', { email: userData.email, id: userData.id });
        setUser(userData);
        // Save email if user is loaded
        if (userData.email) {
          // Check if it's a Google account by checking the provider
          const provider = userData.provider === 'google' ? 'google' : 'email';
          const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          saveEmail(userData.email, provider, name || undefined);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ /api/auth/me failed:', response.status, errorText);
        // Token is invalid
        localStorage.removeItem('simpleAuthToken');
        setToken(null);
      }
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      localStorage.removeItem('simpleAuthToken');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login with:', { email, password: password ? '***' : 'empty' });
      
      // Try Supabase login first
      console.log('🔐 Sending request to /api/auth/login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('🔐 Login response status:', response.status);
      console.log('🔐 Login response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        const token = data.token || data.supabaseToken || (data.user && btoa(`${data.user.id}:${Date.now()}`));
        if (!token || !data.user) {
          toast({
            title: "Error de sesión",
            description: "El servidor no devolvió sesión. Intenta de nuevo.",
            variant: "destructive",
          });
          return;
        }
        localStorage.setItem('simpleAuthToken', token);
        setToken(token);
        setUser(data.user);
        saveEmail(data.user.email, 'email');
        toast({
          title: "¡Bienvenido!",
          description: data.message,
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        let message = "Email o contraseña incorrectos";
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {
          message = response.status === 401 ? "Email o contraseña incorrectos" : "Error al iniciar sesión";
        }
        toast({
          title: "Error de login",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Login error caught:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar al servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        let data: { token?: string; user?: any; message?: string };
        try {
          data = await response.json();
        } catch {
          toast({
            title: "Error",
            description: "La respuesta del servidor no es válida.",
            variant: "destructive",
          });
          return;
        }
        if (!data.token || !data.user) {
          toast({
            title: "Error de registro",
            description: "El servidor no devolvió sesión. Intenta de nuevo.",
            variant: "destructive",
          });
          return;
        }
        localStorage.setItem('simpleAuthToken', data.token);
        setToken(data.token);
        setUser(data.user);
        saveEmail(data.user.email, 'email', `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim());
        const intent = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("intent") : null;
        toast({
          title: intent === "trial" ? "¡Prueba activada!" : "¡Cuenta creada!",
          description: intent === "trial"
            ? "Tu prueba gratuita de 14 días ha comenzado. Redirigiendo..."
            : (data.message || "Redirigiendo..."),
        });
        setTimeout(() => {
          const target = intent === "trial" ? "/planes?trial_started=1" : "/planes";
          window.location.href = target;
        }, 500);
      } else {
        let message = "Error al crear la cuenta";
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {
          message = response.status === 400 ? "Datos inválidos" : `Error del servidor (${response.status})`;
        }
        const isEmailTaken = message.toLowerCase().includes("ya está registrado") || message.toLowerCase().includes("already");
        toast({
          title: "Error de registro",
          description: isEmailTaken
            ? "Este email ya tiene cuenta. Inicia sesión arriba o usa «Has olvidado tu contraseña» si no recuerdas la contraseña."
            : message,
          variant: "destructive",
        });
        throw new Error(message);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        toast({
          title: "Tiempo de espera agotado",
          description: "El servidor no respondió. Comprueba tu conexión e intenta de nuevo.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error de conexión",
          description: error?.message || "No se pudo conectar al servidor. Revisa la consola (F12).",
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('simpleAuthToken');
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSimpleAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSimpleAuth must be used within a SimpleAuthProvider");
  }
  return context;
}