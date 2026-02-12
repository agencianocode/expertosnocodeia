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
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Save email if user is loaded
        if (userData.email) {
          // Check if it's a Google account by checking the provider
          const provider = userData.provider === 'google' ? 'google' : 'email';
          const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          saveEmail(userData.email, provider, name || undefined);
        }
      } else {
        // Token is invalid
        localStorage.removeItem('simpleAuthToken');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
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
        
        // If Supabase login succeeded, we need to get the token from Supabase client
        // For now, create a simple token for session management
        // Use btoa for base64 encoding in browser (instead of Buffer)
        const token = data.supabaseToken || data.token || btoa(`${data.user.id}:${Date.now()}`);
        
        // Store token and user
        localStorage.setItem('simpleAuthToken', token);
        setToken(token);
        setUser(data.user);
        
        // Save email to localStorage
        saveEmail(data.user.email, 'email');
        
        toast({
          title: "¡Bienvenido!",
          description: data.message,
        });

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        console.log('⚠️ Supabase login failed, trying fallback to /api/login...');
        // Fallback to simple login if Supabase fails
        const simpleResponse = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (simpleResponse.ok) {
          const simpleData = await simpleResponse.json();
          localStorage.setItem('simpleAuthToken', simpleData.token);
          setToken(simpleData.token);
          setUser(simpleData.user);
          
          // Save email to localStorage
          saveEmail(simpleData.user.email, 'email');
          
          toast({
            title: "¡Bienvenido!",
            description: simpleData.message,
          });

          setTimeout(() => {
            window.location.href = "/";
          }, 500);
        } else {
          const errorData = await simpleResponse.json();
          toast({
            title: "Error de login",
            description: errorData.message || "Email o contraseña incorrectos",
            variant: "destructive",
          });
        }
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
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store token and user
        localStorage.setItem('simpleAuthToken', data.token);
        setToken(data.token);
        setUser(data.user);
        
        // Save email to localStorage
        saveEmail(data.user.email, 'email', `${data.user.firstName} ${data.user.lastName}`.trim());
        
        toast({
          title: "¡Cuenta creada!",
          description: data.message,
        });

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error de registro",
          description: errorData.message || "Error al crear la cuenta",
          variant: "destructive",
        });
        throw new Error(errorData.message);
      }
    } catch (error: any) {
      toast({
        title: "Error de conexión",
        description: error.message || "No se pudo conectar al servidor",
        variant: "destructive",
      });
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