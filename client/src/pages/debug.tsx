import { useEffect } from "react";

export default function DebugPage() {
  useEffect(() => {
    // Clear auth token and reload
    localStorage.removeItem('authToken');
    console.log('🧹 Cleared authToken from localStorage');
    
    // Reload the page to reset all state
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">🧹 Limpiando sistema de autenticación...</h1>
        <p className="text-gray-600">Redirigiendo al login...</p>
      </div>
    </div>
  );
}