import { useState } from "react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/layout/sidebar";

export default function SimpleLogin() {
  const { login, isLoading } = useSimpleAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      await login(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-[250px] flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Bienvenido de nuevo</h1>
              <p className="text-muted-foreground">Inicia sesión en tu cuenta</p>
            </div>
            
            <Card className="w-full">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl flex items-center justify-center space-x-2">
                  <span>🔒</span>
                  <span>Iniciar sesión</span>
                </CardTitle>
                <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Dirección de correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="fabianseguraconsultor@gmail.com"
                      required
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Contraseña</Label>
                      <a href="#" className="text-sm text-primary hover:underline">
                        ¿Has olvidado tu contraseña?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isLoading || !email || !password}
                  >
                    {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                  </Button>
                </form>
                
                <div className="mt-4 text-center">
                  <span className="text-sm text-muted-foreground">CONTINUAR CON</span>
                </div>
                
                <div className="mt-4">
                  <Button variant="outline" className="w-full" disabled>
                    <span className="mr-2">👤</span>
                    Acceder como Fabián
                    <span className="ml-2 text-xs">fabianseguraconsultor@gmail.com ▼</span>
                  </Button>
                </div>
                
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <span>¿No tienes una cuenta? </span>
                  <a href="#" className="text-primary hover:underline">Inscríbete</a>
                </div>
                
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                  <input type="checkbox" className="mr-2" />
                  <span>Protegido por seguridad de nivel empresarial</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}