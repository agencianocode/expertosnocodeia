import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  CheckCircle, 
  Code2, 
  Users, 
  BookOpen,
  Star,
  Zap,
  Target,
  Lightbulb,
  FileText,
  MessageSquare,
  Loader2,
  Shield,
  Clock,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function MarketingLanding() {
  const [email, setEmail] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { toast } = useToast();

  // Helper function to get app URL (app.expertosnocodeia.com)
  const getAppUrl = (path: string = '') => {
    if (typeof window === 'undefined') return path;
    const hostname = window.location.hostname;
    
    // Si ya estamos en app.expertosnocodeia.com, usar path relativo
    if (hostname === 'app.expertosnocodeia.com' || hostname.startsWith('app.')) {
      return path;
    }
    
    // Si estamos en expertosnocodeia.com, redirigir a app.expertosnocodeia.com
    if (hostname === 'expertosnocodeia.com' || hostname === 'www.expertosnocodeia.com') {
      return `https://app.expertosnocodeia.com${path}`;
    }
    
    // Para desarrollo local o Railway temporal, usar path relativo
    return path;
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
      return;
    }

    setIsNewsletterSubmitting(true);
    try {
      const response = await fetch('/api/beehiiv/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      if (response.ok) {
        toast({
          title: "¡Suscripción exitosa! 🎉",
          description: "Te hemos enviado un email de confirmación. Revisa tu bandeja de entrada.",
        });
        setNewsletterEmail("");
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error al suscribirse');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo completar la suscripción. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  const faqs = [
    {
      question: "¿Qué incluye la membresía?",
      answer: "Acceso completo a más de 300 guías paso a paso, workshops en vivo semanales, comunidad privada, certificados de finalización y descuentos exclusivos en herramientas NoCode e IA."
    },
    {
      question: "¿Puedo cancelar en cualquier momento?",
      answer: "Sí, puedes cancelar tu suscripción en cualquier momento sin penalizaciones. Tu acceso continuará hasta el final del período pagado."
    },
    {
      question: "¿Hay prueba gratuita?",
      answer: "Sí, ofrecemos 14 días de prueba gratuita para que explores todo el contenido sin compromiso. No se requiere tarjeta de crédito."
    },
    {
      question: "¿Qué diferencia hay entre la membresía y el newsletter?",
      answer: "El newsletter es gratuito y te envía tips semanales por email. La membresía te da acceso completo a la plataforma, cursos, guías, workshops en vivo y comunidad exclusiva."
    },
    {
      question: "¿Los cursos tienen certificados?",
      answer: "Sí, al completar cualquier curso o programa recibirás un certificado de finalización que puedes agregar a tu perfil profesional."
    },
    {
      question: "¿Puedo cambiar de plan después?",
      answer: "Sí, puedes actualizar o cambiar tu plan en cualquier momento desde tu panel de usuario. Los cambios se aplicarán en el próximo ciclo de facturación."
    }
  ];

  const benefits = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "300+ Guías Paso a Paso",
      description: "Aprende con casos de uso reales aplicables inmediatamente"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Comunidad Exclusiva",
      description: "Conecta con profesionales que están transformando sus carreras"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Workshops en Vivo",
      description: "Sesiones semanales con expertos para resolver dudas en tiempo real"
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Certificados Reconocidos",
      description: "Acredita tus conocimientos con certificados profesionales"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Descuentos Exclusivos",
      description: "Accede a descuentos especiales en herramientas NoCode e IA"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Garantía de 30 Días",
      description: "Si no estás satisfecho, te devolvemos tu dinero sin preguntas"
    }
  ];

  const testimonials = [
    {
      name: "María González",
      role: "Emprendedora",
      content: "En 3 meses pasé de no saber nada de NoCode a tener mi primera app funcionando. Los workshops en vivo fueron clave.",
      rating: 5
    },
    {
      name: "Carlos Ramírez",
      role: "Marketing Manager",
      content: "Las guías me ahorraron meses de investigación. Ahora automatizo todo mi marketing sin código.",
      rating: 5
    },
    {
      name: "Ana Martínez",
      role: "Consultora",
      content: "La comunidad es increíble. Siempre encuentro respuestas y he hecho conexiones valiosas.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Expertos NoCode IA</span>
            </div>
            <nav className="hidden lg:flex items-center space-x-6">
              <a href={getAppUrl('/guides')} className="text-gray-300 hover:text-white transition-colors text-sm">
                Guías
              </a>
              <a href={getAppUrl('/courses')} className="text-gray-300 hover:text-white transition-colors text-sm">
                Cursos
              </a>
              <a href={getAppUrl('/planes')} className="text-gray-300 hover:text-white transition-colors text-sm">
                Precios
              </a>
              <a href={getAppUrl('/login')}>
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  Iniciar Sesión
                </Button>
              </a>
              <a href={getAppUrl('/planes')}>
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  Comenzar
                </Button>
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 blur-3xl"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-purple-300">Únete a más de 10,000 profesionales</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Domina NoCode e IA en
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                5 minutos al día
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              La plataforma más completa para aprender NoCode e IA con casos de uso reales
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Únete a profesionales que están transformando sus carreras sin escribir código
            </p>

            {/* Primary CTA - Solo membresía */}
            <div className="mb-8">
              <a href={getAppUrl('/planes')}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg px-10 py-7 rounded-full font-semibold shadow-lg shadow-purple-500/50"
                >
                  Comenzar Prueba Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>

            {/* Newsletter como alternativa sutil */}
            <div className="mb-12">
              <p className="text-sm text-gray-400 mb-3">
                ¿No estás listo aún? Recibe tips gratis por email
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2 justify-center max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Tu email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 rounded-full px-5 py-3 text-sm"
                  disabled={isNewsletterSubmitting}
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white rounded-full px-4"
                  disabled={isNewsletterSubmitting}
                >
                  {isNewsletterSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Newsletter Gratis"
                  )}
                </Button>
              </form>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>14 días gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Cancelar cuando quieras</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Garantía de 30 días</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4 bg-gray-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">10,000+</div>
              <div className="text-gray-400 text-sm">Profesionales activos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">300+</div>
              <div className="text-gray-400 text-sm">Guías paso a paso</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-400 mb-2">50+</div>
              <div className="text-gray-400 text-sm">Cursos completos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">4.9/5</div>
              <div className="text-gray-400 text-sm">Valoración promedio</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Todo lo que necesitas para dominar NoCode e IA
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Una plataforma completa con todo lo necesario para transformar tu carrera
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 mb-4">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-white">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA (Middle) */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gray-900/80 border-purple-500/30">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-white mb-2">
                ¿No estás listo para la membresía completa?
              </CardTitle>
              <CardDescription className="text-lg text-gray-300">
                Únete a nuestro newsletter gratuito y recibe tips semanales de NoCode e IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="email"
                  placeholder="Tu email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 flex-1"
                  disabled={isNewsletterSubmitting}
                />
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={isNewsletterSubmitting}
                >
                  {isNewsletterSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Suscribiendo...
                    </>
                  ) : (
                    <>
                      Suscribirme Gratis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
              <p className="text-sm text-gray-400 mt-4 text-center">
                ✓ Tips semanales • Sin spam • Cancela cuando quieras
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Lo que dicen nuestros miembros</h2>
            <p className="text-gray-400">Únete a profesionales que están transformando sus carreras</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-300 text-base">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 bg-gray-900/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Planes que se adaptan a ti</h2>
            <p className="text-gray-400 text-lg">Elige el plan perfecto para tu nivel y objetivos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Trial */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Prueba Gratis</CardTitle>
                <div className="text-3xl font-bold text-white mt-4">
                  $0<span className="text-lg text-gray-400">/14 días</span>
                </div>
                <CardDescription className="mt-2">Perfecto para empezar</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>5-10 casos de uso de IA</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Cursos certificados</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Guías diarias</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Comunidad privada</span>
                  </li>
                </ul>
                <a href={getAppUrl('/planes')}>
                  <Button className="w-full" variant="outline">
                    Empezar Prueba
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Monthly */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Mensual</CardTitle>
                <div className="text-3xl font-bold text-white mt-4">
                  $39<span className="text-lg text-gray-400">/mes</span>
                </div>
                <CardDescription className="mt-2">Para profesionales activos</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Todo lo de Prueba Gratis</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>300+ guías paso a paso</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Workshops en vivo</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Certificados de finalización</span>
                  </li>
                </ul>
                <a href={getAppUrl('/planes')}>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                    Empezar Ahora
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Annual */}
            <Card className="bg-gray-900/50 border-purple-500/50 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                  Más Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-white">Anual</CardTitle>
                <div className="text-3xl font-bold text-white mt-4">
                  $299<span className="text-lg text-gray-400">/año</span>
                </div>
                <CardDescription className="mt-2">
                  <span className="text-green-400 font-semibold">Ahorra $169</span> - Mejor valor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Todo lo de Mensual</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>2 meses GRATIS</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Acceso prioritario</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Sesiones 1:1 mensuales</span>
                  </li>
                </ul>
                <a href={getAppUrl('/planes')}>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                    Empezar Ahora
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <a href={getAppUrl('/planes')}>
              <Button variant="link" className="text-purple-400 hover:text-purple-300">
                Ver todos los planes y detalles →
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Preguntas Frecuentes</h2>
            <p className="text-gray-400">Todo lo que necesitas saber antes de empezar</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-800">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-left">{faq.question}</CardTitle>
                    {openFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {openFaq === index && (
                  <CardContent>
                    <CardDescription className="text-gray-300 text-base">
                      {faq.answer}
                    </CardDescription>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            ¿Listo para transformar tu carrera?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Únete a miles de profesionales que ya están dominando NoCode e IA
          </p>
          {/* Solo CTA principal, sin newsletter */}
          <a href={getAppUrl('/planes')}>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg px-10 py-7 rounded-full font-semibold shadow-lg shadow-purple-500/50"
            >
              Comenzar Prueba Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
          <p className="text-sm text-gray-400 mt-6">
            ✓ 14 días gratis • Sin tarjeta de crédito • Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Expertos NoCode IA</span>
              </div>
              <p className="text-gray-400 text-sm">
                La plataforma más completa para aprender NoCode e IA
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href={getAppUrl('/guides')} className="hover:text-white transition-colors">Guías</a></li>
                <li><a href={getAppUrl('/courses')} className="hover:text-white transition-colors">Cursos</a></li>
                <li><a href={getAppUrl('/planes')} className="hover:text-white transition-colors">Precios</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Compañía</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href={getAppUrl('/login')} className="hover:text-white transition-colors">Iniciar Sesión</a></li>
                <li><a href={getAppUrl('/register')} className="hover:text-white transition-colors">Registrarse</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © 2025 Expertos NoCode IA. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

