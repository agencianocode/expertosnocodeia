import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  BookOpen,
  Star,
  Zap,
  Target,
  Loader2,
  Shield,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Briefcase,
  ShoppingCart,
  Globe,
  UtensilsCrossed,
  Wallet,
  Layout,
  Plug,
  Sparkles,
  Bot,
  Headphones,
  Wrench,
  GraduationCap,
  Calendar,
  RefreshCw,
  BarChart3,
  UserPlus,
  Heart,
  PenLine,
  MessageCircle,
  Lock
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

/** Pastilla ovalada: 120×38 px. Logo dentro: 88×22 px (sin texto). Si no hay logo, solo el nombre. */
function PillLogo({ name }: { name: string }) {
  const slug = name.toLowerCase().replace(/^\./, "").replace(/\s+/g, "-");
  const logoPath = `/logos/${slug}.avif`;
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-white border-2 border-gray-200 shadow-sm w-[120px] h-[38px] flex-shrink-0" title={name}>
      <img src={logoPath} alt={name} className="w-[88px] h-[22px] object-contain" onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = "none"; img.nextElementSibling?.classList.remove("hidden"); }} />
      <span className="hidden text-gray-900 font-albert text-sm font-medium whitespace-nowrap">{name}</span>
    </span>
  );
}

export default function MarketingLanding() {
  const [email, setEmail] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { toast } = useToast();

  // Frases que rotan en el hero: "el mundo real" | "en 30 días" | "en su flujo de trabajo"
  const heroPhrases = ["el mundo real", "en 30 días", "en su flujo de trabajo"];
  const [heroPhraseIndex, setHeroPhraseIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setHeroPhraseIndex((i) => (i + 1) % heroPhrases.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  // Avatares para testimonio bajo "Domina la IA en..."
  const heroAvatars = [
    "https://i.pravatar.cc/100?img=1",
    "https://i.pravatar.cc/100?img=3",
    "https://i.pravatar.cc/100?img=5",
    "https://i.pravatar.cc/100?img=8",
    "https://i.pravatar.cc/100?img=11",
    "https://i.pravatar.cc/100?img=12",
  ];

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

  const WHATSAPP_URL = "https://wa.me/1234567890"; // Reemplazar con número real

  const aplicativos = [
    { icon: Briefcase, label: "Sistemas de planificación de recursos empresariales (ERP)", example: "Ejemplos: Bling, ContaAzul" },
    { icon: Users, label: "Sistemas de gestión de ventas (CRM)", example: "Ejemplo: Pipedrive" },
    { icon: ShoppingCart, label: "Mercados y portales", example: "Ejemplos: OLX, Infojobs..." },
    { icon: Globe, label: "Redes sociales", example: "Por ejemplo: Twitter, Instagram..." },
    { icon: UtensilsCrossed, label: "Aplicaciones de entrega", example: "Ej: Delivery directo, Express..." },
    { icon: Wallet, label: "Fintechs e inversiones", example: "Ejemplos: Rufy, EON, Bloxs..." },
    { icon: Layout, label: "Áreas de miembros", example: "Ej: Hotmart Club, Circle..." },
    { icon: Plug, label: "Integraciones API", example: "Conecta tus herramientas" },
    { icon: Sparkles, label: "Inteligencia artificial", example: "Proyectos con IA" },
    { icon: Bot, label: "Automatización", example: "Flujos y procesos automáticos" },
  ];

  const agentesIA = [
    { icon: ShoppingCart, label: "Agente IA de Ventas" },
    { icon: Users, label: "Agente IA SDR" },
    { icon: Headphones, label: "Agente IA de Atendimiento" },
    { icon: Wrench, label: "Agente IA de Soporte Técnico" },
    { icon: GraduationCap, label: "Agente IA Tutor para Cursos" },
    { icon: Calendar, label: "Agente IA de Agendamiento" },
    { icon: RefreshCw, label: "Agente IA de Recuperación de Ventas" },
    { icon: BarChart3, label: "Agente IA de Análisis de Datos" },
    { icon: UserPlus, label: "Agente IA de Onboarding" },
    { icon: Heart, label: "Agente IA de Customer Success" },
    { icon: PenLine, label: "Agente IA de Copywriting" },
  ];

  const valueItems = [
    { label: "300+ Guías paso a paso", value: "Incalculable" },
    { label: "Cursos y programas certificados", value: "Incalculable" },
    { label: "Comunidad exclusiva", value: "Incalculable" },
    { label: "Workshops en vivo semanales", value: "Incalculable" },
    { label: "Certificados de finalización", value: "Incalculable" },
    { label: "Descuentos en herramientas", value: "Incalculable" },
    { label: "Garantía de 30 días", value: "Incalculable" },
  ];

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

  // Cards para la sección "¿Qué recibiré?": texto arriba, imagen debajo (imágenes sin texto). 9 ítems.
  const queRecibireCards = [
    { icon: Layout, title: "Plataforma exclusiva", description: "Área de miembros con cursos y recursos para aprender NoCode e IA.", image: "/que-recibire/plataforma exclusiva.png" },
    { icon: BookOpen, title: "Cursos y guías", description: "Cursos y guías paso a paso para crear aplicaciones y agentes de IA sin programar.", image: "/que-recibire/cursos y guias.png" },
    { icon: Users, title: "Comunidad", description: "Espacio para conectar con otros miembros y resolver dudas.", image: "/que-recibire/3.jpg" },
    { icon: Award, title: "Certificados", description: "Al completar cursos, certificado de finalización para tu perfil.", image: "/que-recibire/4.jpg" },
    { icon: Sparkles, title: "Contenido práctico", description: "Enfoque en proyectos reales: aplicaciones y agentes que puedes usar.", image: "/que-recibire/5.jpg" },
    { icon: TrendingUp, title: "Descuentos en herramientas", description: "Descuentos exclusivos en herramientas NoCode e IA.", image: "/que-recibire/6.jpg" },
    { icon: Shield, title: "Garantía de 30 días", description: "Prueba sin riesgo: garantía de devolución para que pruebes la plataforma.", image: "/que-recibire/7.jpg" },
    { icon: Zap, title: "Acceso inmediato", description: "Acceso desde el primer día y prueba gratuita para explorar.", image: "/que-recibire/8.jpg" },
    { icon: MessageCircle, title: "Soporte", description: "Resuelve dudas con el equipo y la comunidad cuando lo necesites.", image: "/que-recibire/9.jpg" },
  ];

  const testimonials = [
    {
      name: "María González",
      role: "Emprendedora",
      content: "En 3 meses pasé de no saber nada de NoCode a tener mi primera app funcionando. Los workshops en vivo fueron clave.",
      result: "Primera app en producción en 3 meses",
      rating: 5,
      image: "https://i.pravatar.cc/100?img=1",
    },
    {
      name: "Carlos Ramírez",
      role: "Marketing Manager",
      content: "Las guías me ahorraron meses de investigación. Ahora automatizo todo mi marketing sin código.",
      result: "Automatización completa de marketing sin código",
      rating: 5,
      image: "https://i.pravatar.cc/100?img=3",
    },
    {
      name: "Ana Martínez",
      role: "Consultora",
      content: "La comunidad es increíble. Siempre encuentro respuestas y he hecho conexiones valiosas.",
      result: "Red de contactos y proyectos con la comunidad",
      rating: 5,
      image: "https://i.pravatar.cc/100?img=5",
    },
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

      {/* Hero Section - fondo negro con cuadrícula, letra pegada */}
      <section
        className="relative py-20 sm:py-32 px-4 overflow-hidden bg-black"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      >
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            {/* Badge: Domina la IA en [frase con gradiente] + caritas */}
            <div className="mb-6">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 font-sora text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
                <span className="text-white">Domina la IA en</span>
                <span
                  key={heroPhraseIndex}
                  className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                >
                  {heroPhrases[heroPhraseIndex]}
                </span>
              </div>
              {/* Avatares testimonio (caritas) debajo de la frase */}
              <div className="flex justify-center items-center gap-2 mt-4">
                <div className="flex -space-x-2">
                  {heroAvatars.map((src, i) => (
                    <Avatar
                      key={i}
                      className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-black ring-2 ring-black rounded-full"
                    >
                      <AvatarImage src={src} alt="" />
                      <AvatarFallback className="bg-gray-600 text-white text-xs">?</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400 font-albert">Únete a la comunidad</span>
                </div>
              </div>
            </div>

            {/* Headline - Sora 48px negrilla, letra más pegada */}
            <h1 className="font-sora text-3xl sm:text-[42px] lg:text-[48px] font-bold mb-6 text-white max-w-4xl mx-auto tracking-tight leading-[1.1]">
              Cualquiera puede crear aplicaciones y agentes de IA{" "}
              <span className="text-purple-400">sin programación.</span>
            </h1>

            <p className="font-albert text-[18px] text-gray-300 mb-2 max-w-3xl mx-auto tracking-tight leading-snug">
              Conoce la que será la <strong className="text-white">Comunidad No Code + IA</strong> más grande de Latinoamérica.
            </p>
            <p className="font-albert text-[18px] text-gray-400 mb-12 max-w-3xl mx-auto tracking-tight leading-snug">
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

      {/* ¿Por qué aprender IA y No Code? */}
      <section
        className="py-16 sm:py-20 px-6 sm:px-10 lg:px-16 bg-gray-100"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      >
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-center font-sora text-3xl sm:text-[42px] lg:text-[48px] font-bold text-gray-900 mb-10 tracking-tighter leading-tight">
            ¿Por qué aprender <span className="text-purple-600">IA</span> y <span className="text-purple-600">No Code</span>?
          </h2>

          <div className="space-y-4">
            {/* Card 1 - Fondo púrpura oscuro */}
            <div className="bg-purple-900 rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-2 border-purple-700/90 border-b-4 border-b-purple-600">
              <div className="flex items-center gap-4 sm:gap-6">
                <div>
                  <div className="text-4xl sm:text-5xl font-bold text-white font-sora">15°</div>
                  <div className="text-white/90 text-sm mt-1">No-Code</div>
                  <div className="flex items-center gap-1 mt-2 text-white">
                    <span className="font-semibold">$8.699</span>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="text-white/70 text-xs mt-1">138 participantes</div>
                </div>
              </div>
              <div className="sm:max-w-md">
                <p className="text-white text-base sm:text-lg">
                  Salario promedio de $8.000 usd/mes para desarrolladores No Code IA.
                </p>
                <p className="text-white/70 text-xs mt-2">
                  Fuente:{" "}
                  <a
                    href="https://www.portafolio.co/economia/empleo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/90 underline hover:text-white"
                  >
                    portafolio.co/economia/empleo
                  </a>
                </p>
              </div>
            </div>

            {/* Card 2 - Fondo blanco */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-2 border-gray-300 border-b-4 border-b-gray-400">
              <div className="sm:max-w-md">
                <p className="text-gray-900 text-base sm:text-lg">
                  Los profesionales de IA están <span className="text-purple-600 font-semibold">bien pagados</span> y son irremplazables.
                </p>
              </div>
              <div className="sm:max-w-sm">
                <p className="text-gray-700 text-sm">
                  Los profesionales de inteligencia artificial pueden ganar hasta $32.000; la alta demanda se explica por salarios atractivos.
                </p>
                <p className="text-gray-500 text-xs mt-2">Según estudios de mercado internacional</p>
              </div>
            </div>

            {/* Card 3 - Fondo púrpura oscuro + gráfico */}
            <div className="bg-purple-900 rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-2 border-purple-700/90 border-b-4 border-b-purple-600">
              <div className="flex-1 min-w-0">
                <div className="text-white/90 text-xs font-medium mb-3">Mercado de Agentes IA (proyección)</div>
                <div className="flex items-end gap-1 sm:gap-2 h-24">
                  {[40, 55, 70, 85, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-purple-700 to-purple-400 min-w-[24px]"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-white/70 text-[10px] sm:text-xs">
                  <span>ML</span>
                  <span>DL</span>
                  <span>NLP</span>
                  <span>CV</span>
                  <span>Otros</span>
                </div>
                <p className="text-white/60 text-[10px] mt-2">45,8% CAGR 2025-2030 · Grand View Research</p>
              </div>
              <div className="lg:max-w-sm">
                <p className="text-white text-base sm:text-lg">
                  Se proyecta que el mercado de agentes de IA crecerá un 45,8% anual hasta 2030.
                </p>
                <p className="text-white/70 text-xs mt-2">Fuente: grandviewresearch.com</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <a href={getAppUrl('/planes')}>
              <Button className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 py-6 text-lg font-semibold border-2 border-green-800 border-b-4 border-b-green-900">
                Quiero empezar ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Sea honesto: solo la imagen. Fondo #101010. */}
      <section className="relative py-8 sm:py-12 px-4 bg-[#101010]">
        <div className="container mx-auto max-w-3xl flex justify-center">
          <img
            src="/sea-honesto-persona.png"
            alt="Sea honesto: ¿alguna vez se ha hecho alguna de estas preguntas? En la Comunidad No-Code aprenderás paso a paso."
            className="w-full h-auto rounded-xl"
            decoding="async"
          />
        </div>
      </section>

      {/* ¿Cuáles son las oportunidades? - Como imagen 1: cuadrícula grande, cards 318x160, borde negro abajo grueso */}
      <section
        className="relative py-16 sm:py-20 px-4 bg-[#b87cff]"
        style={{
          backgroundImage: `
            linear-gradient(#b175f9 2px, transparent 2px),
            linear-gradient(90deg, #b175f9 2px, transparent 2px)
          `,
          backgroundSize: "56px 56px",
        }}
      >
        <div className="container mx-auto max-w-5xl relative z-10">
          <h2 className="text-center font-sora text-2xl sm:text-[48px] font-bold text-white mb-12 leading-tight">
            ¿Cuáles son las<br className="sm:hidden" /> oportunidades?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
            <div className="w-[318px] h-[160px] bg-purple-900 rounded-xl p-4 flex flex-col justify-center border-2 border-black border-b-4 text-white overflow-hidden">
              <h3 className="font-albert text-[18px] font-bold mb-1 text-white leading-tight line-clamp-2">Crear aplicaciones web y móviles.</h3>
              <p className="font-albert text-[16px] font-normal text-white/90 leading-snug line-clamp-2">Desarrollar aplicaciones profesionales.</p>
            </div>
            <div className="w-[318px] h-[160px] bg-purple-900 rounded-xl p-4 flex flex-col justify-center border-2 border-black border-b-4 text-white overflow-hidden">
              <h3 className="font-albert text-[18px] font-bold mb-1 text-white leading-tight line-clamp-2">Crear agentes de IA</h3>
              <p className="font-albert text-[16px] font-normal text-white/90 leading-snug line-clamp-2">Automatiza tareas con Inteligencia Artificial.</p>
            </div>
            <div className="w-[318px] h-[160px] bg-purple-900 rounded-xl p-4 flex flex-col justify-center border-2 border-black border-b-4 text-white overflow-hidden">
              <h3 className="font-albert text-[18px] font-bold mb-1 text-white leading-tight line-clamp-2">Implemente agentes de IA en su empresa</h3>
              <p className="font-albert text-[16px] font-normal text-white/90 leading-snug line-clamp-2">Aumente sus ingresos, la satisfacción del cliente y la productividad del equipo.</p>
            </div>
            <div className="w-[318px] h-[160px] bg-purple-900 rounded-xl p-4 flex flex-col justify-center border-2 border-black border-b-4 text-white overflow-hidden">
              <h3 className="font-albert text-[18px] font-bold mb-1 text-white leading-tight line-clamp-2">Crea tu propia Startup, SaaS, MicroSaaS o negocio digital.</h3>
              <p className="font-albert text-[16px] font-normal text-white/90 leading-snug line-clamp-2">Convierte tu idea en un negocio escalable.</p>
            </div>
            <div className="w-[318px] h-[160px] bg-purple-900 rounded-xl p-4 flex flex-col justify-center border-2 border-black border-b-4 text-white overflow-hidden">
              <h3 className="font-albert text-[18px] font-bold mb-1 text-white leading-tight line-clamp-2">Trabaje como desarrollador sin código o gerente de IA y automatización</h3>
              <p className="font-albert text-[16px] font-normal text-white/90 leading-snug line-clamp-2">Cree soluciones sin código y gestione automatizaciones.</p>
            </div>
            <div className="w-[318px] h-[160px] bg-purple-900 rounded-xl p-4 flex flex-col justify-center border-2 border-black border-b-4 text-white overflow-hidden">
              <h3 className="font-albert text-[18px] font-bold mb-1 text-white leading-tight line-clamp-2">Trabaje para empresas en Latinoamérica o en el exterior y reciba su salario en dólares.</h3>
              <p className="font-albert text-[16px] font-normal text-white/90 leading-snug line-clamp-2">Opere globalmente y gane en moneda fuerte.</p>
            </div>
          </div>
        </div>
      </section>

      {/* El curso No Code & IA más grande - Header + ventana plataforma + plataformas */}
      <section
        className="relative py-16 sm:py-24 px-4 bg-[#000000]"
        style={{
          backgroundImage: `
            linear-gradient(#080808 2px, transparent 2px),
            linear-gradient(90deg, #080808 2px, transparent 2px)
          `,
          backgroundSize: "96px 96px",
        }}
      >
        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Logo */}
          <div className="flex justify-center items-center gap-2 mb-6">
            <Sparkles className="h-8 w-8 text-purple-200" />
            <span className="text-white/90 text-lg font-albert">Comunidad</span>
            <span className="text-white text-2xl font-sora font-bold">Expertos NoCode IA</span>
          </div>
          <h2 className="text-center font-sora text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-4xl mx-auto">
            Las formaciones de No Code & AI más grande de Latinoamérica.
          </h2>
          <p className="text-center text-white/95 text-base sm:text-lg max-w-3xl mx-auto mb-2">
            <span className="sm:hidden">
              Aprenda el proceso paso a paso para crear<br />
              aplicaciones y agentes de IA para su empresa, o<br />
              para trabajar como desarrollador o gerente de IA.
            </span>
            <span className="hidden sm:inline">
              Aprenda el proceso paso a paso para crear aplicaciones y agentes de IA<br />
              para su empresa, o para trabajar como desarrollador o gerente de IA.
            </span>
          </p>
          <p className="text-center text-base sm:text-lg font-bold max-w-3xl mx-auto mb-12" style={{ color: "#8440a7" }}>
            Incluso empezando desde el cero absoluto.
          </p>

          {/* Ventana tipo navegador / plataforma */}
          <div className="rounded-xl overflow-hidden shadow-2xl border-2 border-black border-b-4 border-b-black mb-16 max-w-5xl mx-auto bg-white" style={{ transform: "perspective(800px) rotateY(-2deg)" }}>
            <div className="bg-gray-200 px-3 py-2 flex items-center gap-2 border-b border-gray-300">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 flex items-center gap-2 ml-4 bg-white rounded-md px-3 py-1.5 text-sm text-gray-500 border border-gray-300">
                <span>← → ↻</span>
                <span className="flex-1 text-center">app.expertosnocodeia.com</span>
              </div>
              <div className="flex gap-2 text-gray-500">⊞ ⬇ ⛶</div>
            </div>
            <div className="flex min-h-[400px]">
              <aside className="w-48 bg-gray-50 border-r border-gray-200 p-4">
                <div className="font-sora font-bold text-gray-800 mb-4">Plataforma</div>
                <input type="text" placeholder="Buscar..." className="w-full rounded border border-gray-300 px-2 py-1 text-sm mb-4 bg-white" readOnly />
                <nav className="space-y-1 text-sm text-gray-600">
                  <div className="font-medium text-gray-900">Início</div>
                  <div>Cursos</div>
                  <div>Notificaciones</div>
                  <div>Aulas</div>
                  <div>Perfil</div>
                </nav>
              </aside>
              <main className="flex-1 p-6 bg-white">
                <h3 className="font-sora font-bold text-xl text-gray-900 mb-4">IA & Automatizaciones</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["Fundamentos IA", "Custom GPT", "Make", "OpenAI", "n8n Iniciantes", "n8n Avançado"].map((label, i) => (
                    <div key={i} className="h-24 rounded-lg border-2 border-gray-900 border-b-4 flex items-center justify-center text-sm font-albert font-medium text-gray-800 bg-gray-50">
                      {label}
                    </div>
                  ))}
                </div>
              </main>
            </div>
          </div>

          {/* Domina las mejores plataformas */}
          <h3 className="text-center font-sora text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-5 max-w-4xl mx-auto tracking-tight leading-tight">
            Domina las mejores plataformas para<br />
            construir <span style={{ color: "#8440a7" }}>agentes de IA</span> y crear <span style={{ color: "#8440a7" }}>aplicaciones</span>.
          </h3>

          {/* Pills con estilo imagen: fondo blanco, borde gris, logo + nombre. Logos en /logos/nombre.png */}
          <div className="space-y-4">
            <div>
              <p className="text-white font-albert font-bold text-center mb-2 text-[14px]">AI CODING · VIBE CODING</p>
              <div className="flex flex-wrap justify-center gap-3">
                {["Lovable", "Antigravity", "CURSOR", "replit", "supabase"].map((name) => (
                  <PillLogo key={name} name={name} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-albert font-bold text-center mb-2 text-[14px]">NO CODE · LOW CODE</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[".bubble", "FlutterFlow", "weweb", "supabase", "Typebot", "Firebase"].map((name) => (
                  <PillLogo key={name} name={name} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-albert font-bold text-center mb-2 text-[14px]">AGENTES DE IA · AUTOMATIZACIONES</p>
              <div className="flex flex-wrap justify-center gap-3">
                {["n8n", "Chatvolt", "supabase"].map((name) => (
                  <PillLogo key={name} name={name} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-albert font-bold text-center mb-2 text-[14px]">DISEÑO · SITIOS WEB</p>
              <div className="flex flex-wrap justify-center gap-3">
                {["Framer", "WordPress", "elementor", "Figma"].map((name) => (
                  <PillLogo key={name} name={name} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ¿Por qué la Comunidad No-Code es diferente? - Fondo blanco, grid, 3 cards oscuras, CTA verde */}
      <section
        className="py-16 sm:py-20 px-6 sm:px-10 lg:px-16 bg-white"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      >
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-center font-sora font-bold text-gray-900 mb-10 leading-none tracking-tighter mx-auto" style={{ fontSize: "48px" }}>
            <span className="block whitespace-nowrap" style={{ fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif" }}>¿Por qué la Comunidad Expertos</span>
            <span className="block whitespace-nowrap" style={{ fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif" }}>NoCode IA es <span style={{ color: "#ad6eff", fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif", fontSize: "48px", fontWeight: 700 }}>diferente a todo</span></span>
            <span className="block whitespace-nowrap" style={{ fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif" }}>lo que hayas visto antes?</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24 mb-10 justify-items-center">
            <div
              className="relative overflow-hidden rounded-2xl border-2 border-purple-500 border-b-4 border-b-purple-600 shadow-lg bg-gray-900 bg-cover bg-center w-[320px] h-[300px] flex-shrink-0"
              style={{ backgroundImage: "url(/card-comunidad-bg.jpg)" }}
            >
              <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
              <div className="relative z-10 p-5">
                <h3 className="font-bold mb-2 tracking-tighter" style={{ fontSize: "22px", fontFamily: "'Sora Variable', 'Sora', ui-sans-serif, sans-serif", color: "#ffffff" }}>
                  <span style={{ fontFamily: "'Sora Variable', 'Sora', ui-sans-serif, sans-serif", color: "#ffffff" }}>Metodología 100%<br />práctica, sin teoría vacía.</span>
                </h3>
                <p className="font-albert" style={{ fontSize: "18px", lineHeight: "22px", fontWeight: 400, color: "#9eacb3" }}>
                  Aprende haciendo: proyectos reales con IA y automatización desde el primer día. Contenido aplicable que podrás usar en tu trabajo o en tus propios proyectos.
                </p>
              </div>
            </div>
            <div
              className="relative overflow-hidden rounded-2xl border-2 border-purple-500 border-b-4 border-b-purple-600 shadow-lg bg-gray-900 bg-cover bg-center w-[320px] h-[300px] flex-shrink-0"
              style={{ backgroundImage: "url(/card-comunidad-bg-2.jpg)" }}
            >
              <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
              <div className="relative z-10 p-5">
                <h3 className="font-bold mb-2 tracking-tighter" style={{ fontSize: "22px", fontFamily: "'Sora Variable', 'Sora', ui-sans-serif, sans-serif", color: "#ffffff" }}>
                  <span style={{ fontFamily: "'Sora Variable', 'Sora', ui-sans-serif, sans-serif", color: "#ffffff" }}>De cero a la<br />implementación<br />en solo 7 días.</span>
                </h3>
                <p className="font-albert" style={{ fontSize: "18px", lineHeight: "22px", fontWeight: 400, color: "#9eacb3" }}>
                  Te vas con algo funcionando. Un método sencillo, sin rodeos, diseñado para quienes no tienen tiempo que perder.
                </p>
              </div>
            </div>
            <div
              className="relative overflow-hidden rounded-2xl border-2 border-purple-500 border-b-4 border-b-purple-600 shadow-lg bg-gray-900 bg-cover bg-center w-[320px] h-[300px] flex-shrink-0"
              style={{ backgroundImage: "url(/card-comunidad-bg-3.jpg)" }}
            >
              <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
              <div className="relative z-10 p-5">
                <h3 className="font-bold mb-2 tracking-tighter" style={{ fontSize: "22px", fontFamily: "'Sora Variable', 'Sora', ui-sans-serif, sans-serif", color: "#ffffff" }}>
                  <span style={{ fontFamily: "'Sora Variable', 'Sora', ui-sans-serif, sans-serif", color: "#ffffff" }}>Apoyo de verdaderos<br />profesores y expertos.</span>
                </h3>
                <p className="font-albert" style={{ fontSize: "18px", lineHeight: "22px", fontWeight: 400, color: "#9eacb3" }}>
                  Haga preguntas a los profesores que construyen, implementan y corrigen proyectos todos los días.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-700 font-albert max-w-2xl mx-auto mb-8 space-y-3" style={{ fontSize: "18px" }}>
            <p>
              Mientras que otros cursos mezclan mucha teoría con contenido técnico innecesario, la Comunidad No-Code está <strong className="text-gray-900">100% enfocada en el conocimiento práctico.</strong>
            </p>
            <div className="flex justify-center">
            <p className="whitespace-nowrap text-center">
              Aprenderás a utilizar sólo las <strong className="text-gray-900">mejores herramientas visuales</strong> en un contenido totalmente aplicable.
            </p>
          </div>
            <p>
              Y en sólo las primeras <strong className="text-gray-900">5 horas de curso</strong>, ya habrás creado tu primera <strong className="text-gray-900">Aplicación o Agente de IA</strong>, incluso con <strong className="text-gray-900">CERO experiencia</strong> (y sin necesidad de programar).
            </p>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold px-8 py-6 text-base rounded-xl shadow-lg border-2 border-green-600 border-b-4 border-b-green-800"
              onClick={() => document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })}
            >
              Quiero registrarme en la Comunidad.
              <ArrowRight className="ml-2 h-5 w-5 inline" />
            </Button>
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

      {/* ¿Qué recibiré? - Beneficios al registrarse */}
      <section
        className="py-16 sm:py-20 px-4 bg-[#0f0f1a]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-white font-sora">¿Qué recibiré?</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto font-albert">
              Todo lo que recibirás al registrarte en la Comunidad Expertos NoCode IA
            </p>
          </div>

          {/* Grid: cards 255×286px (+10%), padding 30px 20px, gap 16px */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-12 mx-auto w-full max-w-[255px] sm:max-w-[526px] lg:max-w-[797px]"
            style={{ gap: "16px" }}
          >
            {queRecibireCards.map((item, i) => (
              <div key={i} className="flex flex-col w-full min-w-0 h-[286px]">
                <div className="bg-white rounded-xl border border-gray-200 shadow-md h-full flex flex-col overflow-hidden px-5 py-[30px]">
                  <h3 className="font-sora font-bold text-gray-900 text-sm mb-0.5 flex-shrink-0">{item.title}</h3>
                  <p className="text-gray-500 text-xs font-albert leading-snug flex-shrink-0">{item.description}</p>
                  <div className="flex-1 min-h-0 flex justify-center items-center mt-3">
                    <div className="w-full max-w-[198px] aspect-[4/3] rounded-lg border-2 border-gray-400 overflow-hidden shadow-md relative bg-white">
                      <img
                        src={item.image}
                        alt=""
                        className="w-full h-full object-cover object-center"
                        style={{ filter: "brightness(0.88) contrast(1.08)" }}
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = "none";
                          const placeholder = el.nextElementSibling;
                          if (placeholder) (placeholder as HTMLElement).classList.remove("hidden");
                        }}
                      />
                      <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-800/80 text-gray-500" aria-hidden="true">
                        <item.icon className="h-12 w-12" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a href={getAppUrl('/planes')}>
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-6 text-base rounded-xl">
                Quiero recibirlo todo
                <ArrowRight className="ml-2 h-5 w-5 inline" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ¿Qué tipos de aplicativos podrás crear? */}
      <section className="py-16 sm:py-20 px-4 bg-[#0f0f1a]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">¿Qué tipos de aplicativos podrás crear?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Desarrolla aplicaciones profesionales sin escribir código</p>
          </div>
          {/* 4 cards primera fila (235x191), 3+3 abajo (320x168) */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-4 justify-center">
              {aplicativos.slice(0, 4).map((item, i) => (
                <div key={i} className="w-[235px] h-[191px] flex flex-col bg-gray-800/50 rounded-lg border-2 border-gray-700 border-b-4 border-b-gray-600 p-4 text-left hover:border-purple-500/50 transition-colors overflow-hidden">
                  <item.icon className="h-6 w-6 text-purple-400 mb-2 flex-shrink-0" />
                  <p className="font-albert text-[18px] font-medium text-gray-300 mb-0.5 line-clamp-3">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-auto">{item.example}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {aplicativos.slice(4, 7).map((item, i) => (
                <div key={i + 4} className="w-[320px] h-[168px] flex flex-col bg-gray-800/50 rounded-lg border-2 border-gray-700 border-b-4 border-b-gray-600 p-4 text-left hover:border-purple-500/50 transition-colors overflow-hidden">
                  <item.icon className="h-6 w-6 text-purple-400 mb-2 flex-shrink-0" />
                  <p className="font-albert text-[18px] font-medium text-gray-300 mb-0.5 line-clamp-2">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-auto">{item.example}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {aplicativos.slice(7, 10).map((item, i) => (
                <div key={i + 7} className="w-[320px] h-[168px] flex flex-col bg-gray-800/50 rounded-lg border-2 border-gray-700 border-b-4 border-b-gray-600 p-4 text-left hover:border-purple-500/50 transition-colors overflow-hidden">
                  <item.icon className="h-6 w-6 text-purple-400 mb-2 flex-shrink-0" />
                  <p className="font-albert text-[18px] font-medium text-gray-300 mb-0.5 line-clamp-2">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-auto">{item.example}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-10">
            <a href={getAppUrl('/planes')}>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Quiero empezar a crear
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ¿Qué tipos de Agentes IA podrás crear? */}
      <section className="py-16 sm:py-20 px-4 bg-gray-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">¿Qué tipos de Agentes IA podrás crear?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Automatiza tareas con inteligencia artificial</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {agentesIA.map((item, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-left hover:border-purple-500/50 transition-colors">
                <item.icon className="h-6 w-6 text-blue-400 mb-2" />
                <p className="text-sm text-gray-300">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href={getAppUrl('/planes')}>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Quiero empezar a crear
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section - más compacto */}
      <section className="py-16 px-4 bg-purple-950/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Todo lo que necesitas para dominar NoCode e IA
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              Una plataforma completa con todo lo necesario para transformar tu carrera
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* ¿Cuánto vale todo esto? */}
      <section className="py-16 sm:py-20 px-4 bg-[#0f0f1a]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">¿Cuánto vale todo esto?</h2>
            <p className="text-gray-400">Todo lo que recibes al unirte a Expertos NoCode IA</p>
          </div>
          <div className="space-y-3 mb-8">
            {valueItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{item.label}</span>
                </div>
                <span className="text-sm text-gray-500">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="text-center mb-6">
            <p className="text-2xl font-bold text-white mb-2">Oferta especial</p>
            <p className="text-lg text-gray-400">Desde $39/mes con 14 días de prueba gratuita</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mb-8">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-400" />
              <span>Pago seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-400" />
              <span>Acceso inmediato</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              <span>Garantía de 30 días</span>
            </div>
          </div>
          <div className="text-center">
            <a href={getAppUrl('/planes')}>
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6">
                Quiero inscribirme
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Yo asumo todo el riesgo */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-8 sm:p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Y lo mejor: yo asumo todo el riesgo</h2>
            <p className="text-gray-300 mb-6">
              Garantía de 30 días, 100% libre de riesgo. Puedes probar la plataforma, ver las clases y descargar materiales. Si no es lo que buscabas, te devolvemos el 100% de tu dinero. Sin burocracia.
            </p>
            <a href={getAppUrl('/planes')}>
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                Quiero inscribirme
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ¿Y los alumnos? */}
      <section className="py-16 sm:py-20 px-4 bg-purple-950/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">¿Y los alumnos? ¿Están logrando sus objetivos?</h2>
            <p className="text-gray-400">Conoce a profesionales que ya transformaron su carrera</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Card key={i} className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-3">
                    <Avatar className="h-14 w-14 border-2 border-gray-700">
                      <AvatarImage src={t.image} alt={t.name} />
                      <AvatarFallback className="bg-gray-700 text-white">{t.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-white">{t.name}</div>
                      <div className="text-sm text-gray-400">{t.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-300 text-base">"{t.content}"</CardDescription>
                  <p className="text-sm font-medium text-purple-400 mt-2">{t.result}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA (opcional) */}
      <section className="py-12 px-4 bg-[#0f0f1a]">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gray-900/80 border-purple-500/30">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-white mb-2">¿No estás listo para la membresía completa?</CardTitle>
              <CardDescription className="text-gray-300">Recibe tips semanales de NoCode e IA por email</CardDescription>
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
                <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600" disabled={isNewsletterSubmitting}>
                  {isNewsletterSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suscribirme Gratis"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 px-4 bg-gray-900/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Preguntas Frecuentes</h2>
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

      {/* ¿Alguna duda? */}
      <section className="py-12 px-4 bg-[#0f0f1a]">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">¿Te quedó alguna duda?</h2>
          <p className="text-gray-400 mb-6">Escríbenos por WhatsApp y te respondemos sin compromiso.</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
              <MessageCircle className="mr-2 h-5 w-5" />
              Hablar con nosotros
            </Button>
          </a>
        </div>
      </section>

      {/* Cierre motivacional + CTA final */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">¡Basta de dejarlo para después!</h2>
          <p className="text-lg text-gray-300 mb-4 max-w-2xl mx-auto">
            Tienes toda la información para dar el siguiente paso. El mercado está en auge y las herramientas están a tu alcance.
          </p>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            La única barrera entre tú y esta oportunidad ya no existe. No se trata solo de conocimiento: es una decisión. En 30 días podrías estar cerrando tu primer proyecto. O seguir exactamente donde estás ahora.
          </p>
          <a href={getAppUrl('/planes')}>
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white text-lg px-10 py-7 rounded-full font-semibold">
              Ahora me decido
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
          <p className="text-sm text-gray-400 mt-6">14 días gratis • Sin tarjeta de crédito • Cancela cuando quieras</p>
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
                La mayor plataforma de educación en NoCode e IA en español. La plataforma más completa para aprender NoCode e IA.
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

