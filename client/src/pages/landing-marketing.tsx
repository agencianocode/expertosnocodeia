import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  CheckCircle, 
  Code2, 
  Users, 
  BookOpen,
  Zap,
  Target,
  Lightbulb,
  Star,
  TrendingUp,
  Shield,
  Clock
} from "lucide-react";

export default function LandingMarketing() {
  const features = [
    {
      icon: BookOpen,
      title: "Cursos Completos",
      description: "Aprende NoCode e IA con cursos estructurados paso a paso",
    },
    {
      icon: Zap,
      title: "Guías Diarias",
      description: "Recibe guías prácticas todos los días para implementar de inmediato",
    },
    {
      icon: Users,
      title: "Comunidad Privada",
      description: "Conecta con otros expertos y resuelve dudas en tiempo real",
    },
    {
      icon: Target,
      title: "Workshops en Vivo",
      description: "Participa en sesiones semanales con expertos de la industria",
    },
    {
      icon: Lightbulb,
      title: "Casos de Éxito",
      description: "Aprende de proyectos reales y casos de estudio documentados",
    },
    {
      icon: Shield,
      title: "Certificaciones",
      description: "Obtén certificados reconocidos al completar tus cursos",
    },
  ];

  const testimonials = [
    {
      name: "María González",
      role: "Emprendedora",
      content: "En 3 meses logré crear mi primer SaaS sin código. Los cursos son increíbles.",
      rating: 5,
    },
    {
      name: "Carlos Ramírez",
      role: "Desarrollador",
      content: "La comunidad es el mejor recurso. Siempre hay alguien dispuesto a ayudar.",
      rating: 5,
    },
    {
      name: "Ana Martínez",
      role: "Consultora",
      content: "Los workshops en vivo me han permitido implementar IA en mis proyectos.",
      rating: 5,
    },
  ];

  const stats = [
    { value: "10,000+", label: "Estudiantes" },
    { value: "500+", label: "Cursos" },
    { value: "50+", label: "Workshops" },
    { value: "98%", label: "Satisfacción" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Expertos NoCode IA
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors text-sm">
                Características
              </Link>
              <Link href="#testimonials" className="text-gray-300 hover:text-white transition-colors text-sm">
                Testimonios
              </Link>
              <Link href="/planes" className="text-gray-300 hover:text-white transition-colors text-sm">
                Planes
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/planes">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  Comenzar
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 blur-3xl" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            <Badge className="mb-6 bg-purple-600/20 text-purple-300 border-purple-500/50">
              🚀 La Universidad de NoCode e IA
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Crea sin código,
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                escala con IA
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Únete a la comunidad más grande de expertos en NoCode e IA. Aprende, crea y monetiza tus ideas sin escribir una línea de código.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/planes">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-purple-500/50"
                >
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-gray-700 text-white hover:bg-gray-800/50 px-8 py-6 text-lg"
                >
                  Ver Características
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-gray-800/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Todo lo que necesitas para
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                dominar NoCode e IA
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Una plataforma completa con todo lo necesario para crear, aprender y crecer
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Lo que dicen nuestros
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                estudiantes
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                ¿Listo para comenzar?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Únete a miles de estudiantes que ya están creando sin código y escalando con IA
              </p>
              <Link href="/planes">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-purple-500/50"
                >
                  Ver Planes y Precios
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">Expertos NoCode IA</span>
              </div>
              <p className="text-gray-400 text-sm">
                La universidad de NoCode e IA para profesionales
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/courses" className="hover:text-white transition-colors">Cursos</Link></li>
                <li><Link href="/guides" className="hover:text-white transition-colors">Guías</Link></li>
                <li><Link href="/talleres" className="hover:text-white transition-colors">Workshops</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Comunidad</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/planes" className="hover:text-white transition-colors">Planes</Link></li>
                <li><Link href="#testimonials" className="hover:text-white transition-colors">Testimonios</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Soporte</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Términos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacidad</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800/50 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2024 Expertos NoCode IA. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

