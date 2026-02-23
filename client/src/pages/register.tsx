import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Users, 
  Award, 
  Zap,
  ArrowRight,
  CheckCircle,
  Globe
} from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");

  const handleReglitLogin = () => {
    window.location.href = "/api/login";
  };

  const features = [
    {
      icon: BookOpen,
      title: "Acceso Completo",
      description: "Todos los cursos y guías de IA"
    },
    {
      icon: Award, 
      title: "Certificados",
      description: "Obtén certificaciones reconocidas"
    },
    {
      icon: Users,
      title: "Comunidad",
      description: "Conecta con otros profesionales"
    },
    {
      icon: Zap,
      title: "Actualizaciones",
      description: "Contenido nuevo cada semana"
    }
  ];

  const testimonials = [
    {
      name: "María González",
      role: "Consultora Digital",
      text: "Los cursos me ayudaron a implementar IA en mi agencia y aumentar ingresos 300%."
    },
    {
      name: "Carlos Ruiz",
      role: "Desarrollador",
      text: "La mejor inversión para mi carrera. El contenido es práctico y actualizado."
    },
    {
      name: "Ana López",
      role: "Marketing Manager",
      text: "Pasé de principiante a experta en IA para marketing en solo 2 meses."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Value Proposition */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                <Globe className="h-4 w-4" />
                Universidad IA en Español
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Domina la <span className="text-purple-400">Inteligencia Artificial</span> para tu negocio
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Aprende IA práctica con expertos hispanos. Cursos, certificaciones y herramientas 
                para profesionales y empresarios.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                    <Icon className="h-5 w-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-white font-medium">{feature.title}</h3>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Social Proof */}
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>+2,000 estudiantes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>95% satisfacción</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Certificados oficiales</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Comienza Gratis</CardTitle>
                <CardDescription className="text-gray-400">
                  Únete a la comunidad IA más grande en español
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Signup */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-white">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <Button 
                    onClick={handleReglitLogin}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
                  >
                    Crear Cuenta Gratuita
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <Separator className="bg-slate-700" />

                {/* Replit Login */}
                <Button
                  onClick={handleReglitLogin}
                  variant="outline"
                  className="w-full border-slate-600 text-white hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gradient-to-r from-orange-400 to-red-400 rounded"></div>
                    Continuar con Replit
                  </div>
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Al registrarte aceptas nuestros{" "}
                  <Link href="/condiciones-servicio" className="text-purple-400 hover:underline">
                    Términos de Servicio
                  </Link>{" "}
                  y{" "}
                  <Link href="/politica-privacidad" className="text-purple-400 hover:underline">
                    Política de Privacidad
                  </Link>
                </p>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-gray-400">
                ¿Ya tienes cuenta?{" "}
                <Button
                  onClick={handleReglitLogin}
                  variant="link"
                  className="text-purple-400 hover:text-purple-300 p-0 h-auto"
                >
                  Inicia Sesión
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-slate-900/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Lo que dicen nuestros estudiantes
            </h2>
            <p className="text-gray-400">
              Profesionales que transformaron su carrera con IA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <p className="text-gray-300 italic">"{testimonial.text}"</p>
                    <div>
                      <p className="text-white font-medium">{testimonial.name}</p>
                      <p className="text-gray-400 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="container mx-auto px-4 py-8 text-center">
        <Button
          onClick={handleReglitLogin}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-8"
        >
          Comenzar Ahora - Es Gratis
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}