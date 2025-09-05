import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { 
  LoginData,
  RegisterData,
  User as SelectUser
} from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthResponse, Error, LoginData>;
  registerMutation: UseMutationResult<AuthResponse, Error, RegisterData>;
  googleLoginMutation: UseMutationResult<AuthResponse, Error, { idToken: string }>;
  logoutMutation: UseMutationResult<void, Error, void>;
  isAuthenticated: boolean;
  token: string | null;
  setToken: (token: string | null) => void;
};

type AuthResponse = {
  user: SelectUser;
  token: string;
  message: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function NewAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [token, setTokenState] = useState<string | null>(null);

  // Initialize token from localStorage or URL param on mount
  useEffect(() => {
    // Check URL for token (from Google OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      setTokenState(urlToken);
      localStorage.setItem('authToken', urlToken);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Check localStorage
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setTokenState(storedToken);
      }
    }
  }, []);

  // Set token helper that updates both state and localStorage
  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('authToken', newToken);
    } else {
      localStorage.removeItem('authToken');
    }
  };

  // Note: We handle authorization headers in the apiRequest function in queryClient
  // instead of overriding the global fetch to avoid conflicts

  // Query user data
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (invalid token)
      if (error?.message?.includes('401')) {
        setToken(null); // Clear invalid token
        return false;
      }
      return failureCount < 3;
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (data: AuthResponse) => {
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "Bienvenido",
        description: data.message,
      });
      // Redirect to dashboard after successful login
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error de login",
        description: error.message || "Error desconocido",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      return await res.json();
    },
    onSuccess: (data: AuthResponse) => {
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "¡Cuenta creada!",
        description: data.message,
      });
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Error de registro",
        description: error.message || "Error desconocido",
        variant: "destructive",
      });
    },
  });

  // Google login mutation
  const googleLoginMutation = useMutation({
    mutationFn: async ({ idToken }: { idToken: string }): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/google/verify", { idToken });
      return await res.json();
    },
    onSuccess: (data: AuthResponse) => {
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "Bienvenido",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error con Google",
        description: error.message || "Error desconocido",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (token) {
        await apiRequest("POST", "/api/auth/logout");
      }
    },
    onSuccess: () => {
      setToken(null);
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear(); // Clear all cached data
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    },
    onError: (error: any) => {
      // Even if server logout fails, clear local state
      setToken(null);
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión localmente",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        registerMutation,
        googleLoginMutation,
        logoutMutation,
        isAuthenticated: !!user && !!token,
        token,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useNewAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useNewAuth must be used within a NewAuthProvider");
  }
  return context;
}