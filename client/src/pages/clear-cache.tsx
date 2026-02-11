import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function ClearCache() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Limpiar todo el localStorage
    localStorage.clear();
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Redirigir al login después de 1 segundo
    setTimeout(() => {
      setLocation('/login');
    }, 1000);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Limpiando caché...</h2>
        <p className="text-muted-foreground">Serás redirigido al login en un momento.</p>
      </div>
    </div>
  );
}

