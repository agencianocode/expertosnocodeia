import { useState, useEffect } from "react";
import { Link } from "wouter";
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
  Lock,
  Plus,
  Minus,
  Send
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
    { icon: ShoppingCart, label: "Agente de ventas de IA", description: "Realizar ventas, ofrecer productos y servicios, presentar la mejor oferta y superar objeciones." },
    { icon: Users, label: "Agente de IA de SDR", description: "Califica clientes potenciales, programa reuniones y fomenta relaciones con clientes potenciales." },
    { icon: Headphones, label: "Agente de servicio al cliente con inteligencia artificial", description: "Resuelve dudas, soluciona problemas y deleita a los clientes 24/7 sin interrupciones." },
    { icon: Wrench, label: "Agente de soporte técnico de IA", description: "Diagnostica problemas, ofrece soluciones y escala casos complejos." },
    { icon: GraduationCap, label: "Tutor de agentes de IA para cursos en línea", description: "Personaliza el aprendizaje del alumno, aclara dudas y monitoriza su progreso." },
    { icon: Calendar, label: "Agente de programación de IA", description: "Administra la agenda del cliente, visualizando, programando y modificando citas." },
    { icon: RefreshCw, label: "Agente de recuperación de ventas de IA", description: "Contacta automáticamente a clientes potenciales que aún no han comprado, supera objeciones y los convierte." },
    { icon: BarChart3, label: "Agente de análisis de datos de IA", description: "Analiza hojas de cálculo y formularios para obtener información que ayude en la toma de decisiones." },
    { icon: UserPlus, label: "Agente de incorporación de IA", description: "Guíe a los nuevos usuarios, personalice la capacitación y acelere la adopción del producto." },
    { icon: Heart, label: "Agente de éxito del cliente con IA", description: "Anticipa las necesidades del cliente y ayuda con la retención." },
    { icon: PenLine, label: "Agente de redacción de textos publicitarios con IA", description: "Crea piezas publicitarias, imágenes, correos electrónicos, secuencias de mensajes, creatividades y guiones." },
    { icon: Plus, label: "Y mucho más...", description: "Si es un trabajo que puede realizar una computadora, un agente podrá hacerlo. Y sabrás cómo crearlo." },
  ];

  const valueItems = [
    { title: "Programa Agentes IA 2.0", description: "Domina la creación de agentes de IA, automatizaciones y chatbots con las herramientas más demandadas del mercado.", value: "$997" },
    { title: "Programa VibeCoding", description: "Aprende a crear aplicaciones completas con IA, sin código y con vibe coding. De la idea al producto en poco tiempo.", value: "$997" },
    { title: "Programa NoCode SaaS IA", description: "Construye tu propio SaaS, micro-SaaS o negocio digital con NoCode e IA, sin programar.", value: "$997" },
    { title: "Cursos de IA Certificados", description: "Cursos con certificación para validar tus habilidades en IA y NoCode ante empleadores y clientes.", value: "$397" },
    { title: "Guías diarias paso a paso", description: "Guías prácticas que se desbloquean semanalmente. Aprende con contenido ordenado y aplicable.", value: "Incalculable" },
    { title: "Comunidades", description: "Espacio para conectar con otros miembros, resolver dudas, compartir avances y proyectos.", value: "Incalculable" },
    { title: "Acceso a Plataforma NoCode Match - Centro de Oportunidades", description: "Plataforma exclusiva para encontrar proyectos, clientes y oportunidades laborales para miembros.", value: "Incalculable" },
    { title: "Contenido Práctico", description: "Enfoque en proyectos reales: aplicaciones y agentes que puedes usar en tu trabajo o emprendimiento.", value: "Incalculable" },
    { title: "Talleres - Workshops semanales (en vivo y a pedido)", description: "Sesiones en vivo con expertos para preguntar, practicar y profundizar. También disponibles bajo demanda.", value: "Incalculable" },
    { title: "Apoyo personalizado de nuestro equipo de expertos", description: "Resuelve dudas con el equipo y la comunidad cuando lo necesites.", value: "Incalculable" },
    { title: "Rutas de Aprendizaje", description: "Rutas paso a paso con metodología única para aprender NoCode e IA de forma ordenada.", value: "Incalculable" },
    { title: "Descuentos en Herramientas", description: "Descuentos exclusivos en herramientas NoCode e IA para miembros.", value: "Incalculable" },
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
      answer: "Acceso completo guías paso a paso todos los días, workshops en vivo semanales, comunidad privada, certificados de finalización y descuentos exclusivos en herramientas NoCode e IA.\n\nLa membresía incluye además:\n• Formación para gestores de agentes de IA\n• Formación en codificación de IA y Vibe Coding\n• Capacitación en IA SaaS\n• Curso N8N\n• Curso Lovable\n• Curso Cursor\n• Curso Supabase\n• Google Antigravity y muchos cursos más"
    },
    {
      question: "¿Cuál es la carga de trabajo?",
      answer: "Hasta la fecha, hay más de 2000 lecciones y más de 200 horas de contenido programado. Pero no te preocupes, esta comunidad no tiene por qué ser de principio a fin. Y por eso estamos en proceso de grabación de las lecciones. En las primeras 15 horas, ya habrás creado dos aplicaciones completas y comprendido los fundamentos para crear cualquier tipo de aplicación. A partir de ahí, tendrás los conocimientos necesarios para empezar a crear y podrás ver más lecciones a medida que avances. Además, actualizamos y grabamos nuevas lecciones cada semana."
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
      question: "¿Cuánto necesito invertir?",
      answer: "La cuota de acceso a la Comunidad No-Code IA es de $297 USD al año. Precio por Lanzamiento. Se puede pagar mes a mes por $39 USD. El método de pago preautorizará el importe total del límite de la tarjeta y cargará las cuotas mensualmente."
    },
    {
      question: "¿Cuáles son los métodos de pago?",
      answer: "Se utiliza Stripe para gestionar los pagos. Se aceptan todas las tarjetas de crédito, débito y recibos bancarios."
    },
    {
      question: "¿Qué pasa si no me gusta el curso?",
      answer: "Ofrecemos una garantía incondicional de 15 días. Si solicitas el reembolso en ese plazo, recibes el 100% de tu dinero y la suscripción se cancela automáticamente. El trámite se hace mediante un botón en la plataforma o vía email a soporte@expertosnocodeia.com"
    },
    {
      question: "¿Cómo funciona el acceso al Marketplace Profesional?",
      answer: "Los miembros pueden enviar su portafolio a No Code Match, donde empresas buscan desarrolladores nocode, expertos en automatizaciones y desarrolladores de Agentes IA. Tendrás acceso a todas las oportunidades disponibles en su portal oficial de oportunidades."
    },
    {
      question: "¿Cuál es el nivel mínimo de conocimientos necesario?",
      answer: "No se requieren conocimientos técnicos previos para usar Lovable, n8n, Antigravity, Cursor y demás. Las formaciones empiezan desde cero absoluto, desde la creación de la cuenta hasta el primer elemento en pantalla. 3 de cada 4 estudiantes comienzan sin saber programar."
    },
    {
      question: "¿Necesito saber inglés?",
      answer: "No es obligatorio; aunque las plataformas estén en inglés, se pueden traducir usando la extensión de Google Translate para Chrome."
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
    },
    {
      question: "¿Existe un mercado laboral para desarrolladores No Code / Low Code?",
      answer: "Sí, existe una demanda mayor de vacantes que de personas cualificadas. El salario promedio reportado para estos desarrolladores supera los $8.000 USD al mes."
    },
    {
      question: "¿Vale la pena para alguien que ya es un desarrollador/programador tradicional?",
      answer: "Sí, porque permite aumentar la empleabilidad en un área de alto crecimiento y poca competencia técnica.\n\nLos programadores pueden aplicar su lógica para crear aplicaciones mucho más rápido y atender a una gama más amplia de clientes.\n\nPermite lanzar startups o proyectos SaaS en cuestión de semanas en lugar de meses."
    }
  ];

  // Cards para la sección "¿Qué recibiré?": texto arriba, imagen debajo (imágenes sin texto). 9 ítems.
  const queRecibireCards = [
    { icon: Layout, title: "Plataforma exclusiva", description: "Área de miembros con cursos y recursos para aprender NoCode e IA.", image: "/que-recibire/plataforma exclusiva.png" },
    { icon: BookOpen, title: "Cursos y guías", description: "Cursos y guías paso a paso para crear aplicaciones y agentes de IA sin programar.", image: "/que-recibire/cursos y guias.png" },
    { icon: Users, title: "Comunidad", description: "Espacio para conectar con otros miembros y resolver dudas.", image: "/que-recibire/comunidad.png" },
    { icon: Award, title: "Centro de oportunidades y profesionales de NoCode", description: "Plataforma para encontrar proyectos y clientes, exclusiva para estudiantes.", image: "/que-recibire/centro de oportunidades.png" },
    { icon: Sparkles, title: "Contenido práctico", description: "Enfoque en proyectos reales: aplicaciones y agentes que puedes usar.", image: "/que-recibire/contenido práctico.png" },
    { icon: TrendingUp, title: "Sesiones de tutoría en vivo", description: "Todas las semanas expertos humanos responderán a tus preguntas de forma práctica.", image: "/que-recibire/sesiones de tutoría en vivo.png" },
    { icon: Shield, title: "Rutas de aprendizaje con metodología única", description: "Rutas paso a paso para aprender NoCode e IA de forma ordenada.", image: "/que-recibire/rutas de aprendizaje.png" },
    { icon: Zap, title: "Reembolsos y descuentos", description: "Descuentos exclusivos en herramientas.", image: "/que-recibire/descuentos herramientas.png" },
    { icon: MessageCircle, title: "Soporte", description: "Resuelve dudas con el equipo y la comunidad cuando lo necesites.", image: "/que-recibire/soporte.png" },
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

  // Carrusel: fotos en client/public/testimonios/ (carrusel-1.jpg … carrusel-8.jpg). Sube ahí tus imágenes.
  const testimonialsCarousel = [
    { name: "María G.", image: "/testimonios/carrusel-1.jpg", comment: "En 3 meses ya tenía mi primera app en producción. Los workshops en vivo fueron clave." },
    { name: "Carlos R.", image: "/testimonios/carrusel-2.jpg", comment: "Ahora automatizo todo mi marketing sin código. Las guías me ahorraron meses." },
    { name: "Ana M.", image: "/testimonios/carrusel-3.jpg", comment: "La comunidad es increíble. He hecho conexiones valiosas y conseguí mis primeros clientes." },
    { name: "Luis F.", image: "/testimonios/carrusel-4.jpg", comment: "Pasé de cero a mi primer agente de IA en menos de una semana. Totalmente recomendado." },
    { name: "Patricia S.", image: "/testimonios/carrusel-5.jpg", comment: "Vale cada peso. Los descuentos en herramientas ya me pagaron la membresía." },
    { name: "Roberto D.", image: "/testimonios/carrusel-6.jpg", comment: "El centro de oportunidades me conectó con mi primer proyecto como freelancer." },
    { name: "Laura V.", image: "/testimonios/carrusel-7.jpg", comment: "Las rutas de aprendizaje me mantuvieron enfocada. Ahora doy soporte en NoCode." },
    { name: "Miguel T.", image: "/testimonios/carrusel-8.jpg", comment: "Certificado en mano y ya con ofertas. Expertos NoCode IA cambió mi rumbo." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header: solo Iniciar sesión; en móvil baja para quedar en la misma línea que el logo central */}
      <header className="absolute top-0 left-0 right-0 z-20 pt-8 px-4 sm:pt-4 sm:px-6">
        <div className="container mx-auto max-w-6xl flex justify-end items-center h-16 sm:h-auto sm:py-2">
          <a
            href={getAppUrl("/login")}
            className="font-albert text-xs sm:text-sm font-medium text-white border border-gray-500 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 hover:bg-white/10 transition-colors"
          >
            Iniciar sesión
          </a>
        </div>
      </header>

      {/* Hero Section - mismo fondo que ¿Qué recibiré?: #000 + cuadrícula 96px */}
      <section
        className="relative pt-8 pb-8 sm:pt-10 sm:pb-32 px-4 overflow-hidden bg-[#000000]"
        style={{
          backgroundImage: `
            linear-gradient(#080808 2px, transparent 2px),
            linear-gradient(90deg, #080808 2px, transparent 2px)
          `,
          backgroundSize: "96px 96px",
        }}
      >
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            {/* Logo del hero: sube tu imagen en client/public/logo-hero.png (o .svg) */}
            <div className="flex justify-center mb-6">
              <img
                src="/logo-hero.png"
                alt="Expertos NoCode IA"
                className="h-16 sm:h-20 object-contain object-center"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
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

            {/* Headline - Sora responsive: 24px móvil, escala en pantallas grandes */}
            <h1 className="font-sora text-[24px] sm:text-[32px] md:text-[40px] lg:text-[48px] font-bold mb-6 text-white max-w-4xl mx-auto tracking-tighter leading-[1.1]" style={{ fontFamily: "'Sora', sans-serif" }}>
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
                  className="bg-[#63d059] hover:bg-[#52b848] font-sora font-bold text-[20px] text-black rounded-full border-2 border-black border-b-4 border-b-black px-10 py-6 transition-colors"
                >
                  Comenzar Prueba Gratis
                  <ArrowRight className="ml-2 h-5 w-5 text-black" />
                </Button>
              </a>
            </div>

            {/* Newsletter como alternativa sutil - estilo organizado como referencia */}
            <div className="mb-6 sm:mb-12 max-w-md mx-auto">
              <p className="text-sm text-gray-400 text-center mb-3">
                ¿No estás listo aún? Recibe tips gratis por email
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex rounded-full border border-gray-600 bg-gray-900/60 overflow-hidden">
                <Input
                  type="email"
                  placeholder="Tu email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 border-0 bg-transparent text-white placeholder:text-gray-500 rounded-none min-h-11 pl-5 pr-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={isNewsletterSubmitting}
                />
                <Button
                  type="submit"
                  className="bg-purple-500 hover:bg-purple-600 text-white shrink-0 px-5 min-h-11 rounded-none border-0"
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
            <div className="hidden sm:grid sm:grid-cols-2 md:flex md:flex-wrap md:justify-center gap-x-4 gap-y-3 md:gap-8 justify-items-start text-sm text-gray-400">
              <div className="flex items-center gap-2 sm:justify-start">
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                <span>14 días gratis</span>
              </div>
              <div className="flex items-center gap-2 sm:justify-start">
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2 sm:justify-start">
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                <span>Cancelar cuando quieras</span>
              </div>
              <div className="flex items-center gap-2 sm:justify-start">
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                <span>Garantía de 30 días</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ¿Por qué aprender IA y No Code? */}
      <section
        className="pt-8 pb-16 sm:py-20 px-6 sm:px-10 lg:px-16 bg-gray-100"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
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
              <Button className="bg-[#63d059] hover:bg-[#52b848] font-sora font-bold text-[20px] text-black rounded-full border-2 border-black border-b-4 border-b-black px-10 py-6 transition-colors">
                Quiero empezar ahora
                <ArrowRight className="ml-2 h-5 w-5 text-black" />
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
          backgroundSize: "56px 56px",
        }}
      >
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-center font-sora font-bold text-gray-900 mb-10 leading-tight tracking-tighter mx-auto px-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl">
            <span className="block" style={{ fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif" }}>¿Por qué la Comunidad Expertos</span>
            <span className="block" style={{ fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif" }}>NoCode IA es <span style={{ color: "#ad6eff", fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif", fontWeight: 700 }}>diferente a todo</span></span>
            <span className="block" style={{ fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif" }}>lo que hayas visto antes?</span>
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
              style={{ backgroundImage: "url(/card-comunidad-bg.jpg)" }}
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

          <div className="text-center text-gray-700 font-albert max-w-2xl mx-auto mb-8 space-y-3 px-2 sm:px-0" style={{ fontSize: "18px" }}>
            <p>
              Mientras que otros cursos mezclan mucha teoría con contenido técnico innecesario, la Comunidad No-Code está <strong className="text-gray-900">100% enfocada en el conocimiento práctico.</strong>
            </p>
            <p className="text-center">
              Aprenderás a utilizar sólo las <strong className="text-gray-900">mejores herramientas visuales</strong> en un contenido totalmente aplicable.
            </p>
            <p>
              Y en sólo las primeras <strong className="text-gray-900">5 horas de curso</strong>, ya habrás creado tu primera <strong className="text-gray-900">Aplicación o Agente de IA</strong>, incluso con <strong className="text-gray-900">CERO experiencia</strong> (y sin necesidad de programar).
            </p>
          </div>

          <div className="text-center px-4 sm:px-0">
            <Button
              size="lg"
              className="w-full sm:w-auto max-w-full bg-[#63d059] hover:bg-[#52b848] font-sora font-bold text-sm sm:text-[20px] text-black rounded-full border-2 border-black border-b-4 border-b-black px-4 py-3.5 sm:px-10 sm:py-6 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
              onClick={() => document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })}
            >
              <span className="sm:hidden">Registrarme en la Comunidad</span>
              <span className="hidden sm:inline">Quiero registrarme en la Comunidad.</span>
              <ArrowRight className="h-5 w-5 flex-shrink-0 text-black" />
            </Button>
          </div>
        </div>
      </section>

      {/* ¿Qué recibiré? - Beneficios al registrarse - mismo estilo que "Las formaciones...": #000 + grid 96px */}
      <section
        className="py-16 sm:py-20 px-2 sm:px-4 bg-[#000000]"
        style={{
          backgroundImage: `
            linear-gradient(#080808 2px, transparent 2px),
            linear-gradient(90deg, #080808 2px, transparent 2px)
          `,
          backgroundSize: "96px 96px",
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="font-bold mb-3 text-white font-sora" style={{ fontSize: "48px" }}>¿Qué recibiré?</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto font-albert">
              Todo lo que recibirás al registrarte en la Comunidad Expertos NoCode IA
            </p>
          </div>

          {/* Grid: cards 255×286px (+10%), padding 30px 20px, gap 16px */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-12 mx-auto w-full max-w-full sm:max-w-[526px] lg:max-w-[797px]"
            style={{ gap: "16px" }}
          >
            {queRecibireCards.map((item, i) => (
              <div key={i} className="flex flex-col w-full min-w-0 min-h-[286px] sm:min-h-0 sm:h-[286px]">
                <div className="bg-white rounded-xl border border-gray-200 shadow-md h-full flex flex-col overflow-hidden px-3 py-4">
                  <div className="min-h-[72px] sm:min-h-[68px] flex-shrink-0">
                    <h3 className="font-sora font-bold text-gray-900 text-sm mb-0.5">{item.title}</h3>
                    <p className="text-gray-500 text-xs font-albert leading-snug line-clamp-3">{item.description}</p>
                  </div>
                  <div className="flex-1 min-h-0 flex justify-center items-center mt-4 sm:mt-2 pb-5 sm:pb-0">
                    <div className="w-full max-w-[280px] mx-auto sm:mx-0 sm:max-w-[225px] sm:w-[225px] aspect-[4/3] sm:aspect-auto sm:h-[168px] flex-shrink-0 rounded-lg border-2 border-gray-400 overflow-hidden shadow-md relative bg-white">
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
              <Button size="lg" className="bg-[#63d059] hover:bg-[#52b848] font-sora font-bold text-[20px] text-black rounded-full border-2 border-black border-b-4 border-b-black px-10 py-6 transition-colors">
                Quiero recibirlo todo
                <ArrowRight className="ml-2 h-5 w-5 inline text-black" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ¿Qué tipos de aplicativos podrás crear? - Fondo blanco, cards estilo imagen */}
      <section
        className="py-16 sm:py-20 px-4 bg-white"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-bold mb-4 text-gray-900 font-sora tracking-tight text-2xl sm:text-3xl md:text-4xl lg:text-[48px]" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.05em" }}>
              ¿Qué tipos de <span className="text-purple-600" style={{ fontFamily: "inherit" }}>aplicaciones</span> podré crear?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Desarrolla aplicaciones profesionales sin escribir código</p>
          </div>
          {/* 4 primera fila, 3 segunda, 3 tercera */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-4 justify-center">
              {aplicativos.slice(0, 4).map((item, i) => (
                <div key={i} className="w-full max-w-[260px] flex flex-col bg-white rounded-xl border-2 border-gray-900 border-b-4 border-b-gray-800 p-4 text-left shadow-sm hover:border-purple-500/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center mb-3 flex-shrink-0">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-albert font-bold text-gray-900 text-[18px] mb-1 line-clamp-3">{item.label}</p>
                  <p className="font-albert text-[16px] text-gray-600">{item.example}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {aplicativos.slice(4, 7).map((item, i) => (
                <div key={i + 4} className="w-full max-w-[320px] flex flex-col bg-white rounded-xl border-2 border-gray-900 border-b-4 border-b-gray-800 p-4 text-left shadow-sm hover:border-purple-500/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center mb-3 flex-shrink-0">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-albert font-bold text-gray-900 text-[18px] mb-1 line-clamp-2">{item.label}</p>
                  <p className="font-albert text-[16px] text-gray-600">{item.example}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {aplicativos.slice(7, 10).map((item, i) => (
                <div key={i + 7} className="w-full max-w-[320px] flex flex-col bg-white rounded-xl border-2 border-gray-900 border-b-4 border-b-gray-800 p-4 text-left shadow-sm hover:border-purple-500/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center mb-3 flex-shrink-0">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-albert font-bold text-gray-900 text-[18px] mb-1 line-clamp-2">{item.label}</p>
                  <p className="font-albert text-[16px] text-gray-600">{item.example}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-10">
            <a href={getAppUrl('/planes')}>
              <Button className="bg-[#63d059] hover:bg-[#52b848] font-sora font-bold text-[20px] text-black rounded-full border-2 border-black border-b-4 border-b-black px-10 py-6 transition-colors">
                ¡Quiero empezar a crear!
                <ArrowRight className="ml-3 h-6 w-6 text-black" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ¿Qué tipos de agentes de IA podré crear? - Mismo estilo que ¿Cuáles son las oportunidades?: fondo #b87cff + cuadrícula, gap-6 */}
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
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900 font-sora">
              ¿Qué tipos de agentes de IA podré crear?
            </h2>
          </div>
          {/* Grid con ancho fijo para que gap-6 sea igual a los lados y arriba/abajo (320*3 + 24*2 = 1008px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto w-full max-w-[320px] sm:max-w-[664px] lg:max-w-[1008px]">
            {agentesIA.map((item, i) => (
              <div key={i} className="w-full max-w-[320px] h-[260px] bg-purple-800 rounded-2xl border-2 border-gray-900 border-b-[6px] border-b-gray-900 p-5 text-left shadow-lg flex flex-col overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-3 flex-shrink-0">
                  <item.icon className="h-6 w-6 text-purple-800" />
                </div>
                <h3 className="font-albert font-bold text-white text-[18px] mb-2 line-clamp-3 leading-tight">{item.label}</h3>
                <p className="font-albert text-[16px] text-white/90 leading-snug flex-1 min-h-0 line-clamp-5">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <a href={getAppUrl('/planes')}>
              <Button className="bg-[#63d059] hover:bg-[#52b848] font-sora font-bold text-[20px] text-black rounded-full border-2 border-black border-b-4 border-b-black px-10 py-6 transition-colors">
                Quiero empezar a crear
                <ArrowRight className="ml-3 h-6 w-6 text-black" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ¿Cuánto vale todo esto? */}
      <section className="py-16 sm:py-20 px-4 bg-white relative overflow-hidden" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: '56px 56px' }}>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-10">
            <h2 className="font-sora text-3xl sm:text-4xl md:text-[48px] font-bold text-black mb-2">¿Cuánto vale todo esto?</h2>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-2 border-black overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {valueItems.map((item, i) => (
                <li key={i} className="flex items-start justify-between gap-4 py-2.5 px-5 sm:px-6">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h3 className="font-sora font-bold text-[16px] text-black leading-tight">{item.title}</h3>
                      <p className="font-albert text-[14px] text-black/80 mt-0.5 leading-snug">{item.description}</p>
                    </div>
                  </div>
                  <span className={`font-sora text-[16px] flex-shrink-0 whitespace-nowrap ${item.value.startsWith('$') ? 'font-bold text-black/70 line-through' : 'italic text-black'}`}>{item.value}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between px-5 sm:px-6 py-3 bg-green-600 text-white font-albert font-bold text-lg">
              <span>VALOR TOTAL:</span>
              <span>$1,997</span>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="font-albert text-[18px] text-black mb-0.5">Pero no necesitarás invertir $1,997 para unirte hoy.</p>
            <p className="font-albert text-[18px] font-bold text-black leading-tight">Descubre la oferta especial por lanzamiento que te hemos preparado:</p>
          </div>
        </div>
      </section>

      {/* Recuerda - Oferta (fondo negro con grid como ¿Qué recibiré?) */}
      <section
        className="py-16 sm:py-20 px-4 sm:px-6 relative overflow-hidden bg-[#000000]"
        style={{
          backgroundImage: `
            linear-gradient(#080808 2px, transparent 2px),
            linear-gradient(90deg, #080808 2px, transparent 2px)
          `,
          backgroundSize: "96px 96px",
        }}
      >
        <div className="container mx-auto max-w-5xl relative z-10 px-4 sm:px-6">
          <div className="flex justify-center w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center w-full max-w-4xl">
              {/* Izquierda: lista de beneficios */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                <h3 className="font-sora font-bold text-[16px] text-white mb-4">Recuerda... esto es todo lo que recibirás:</h3>
                <ul className="space-y-2">
                  {valueItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="font-albert text-[14px] text-white leading-snug">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Centro: tarjeta de oferta (más grande) */}
              <div className="lg:col-span-7 flex justify-center lg:justify-center">
              <div className="w-full max-w-[460px] bg-stone-50 rounded-2xl border-2 border-gray-300 p-8 shadow-xl font-sans">
                <div className="text-center mb-5">
                  <p className="font-bold text-gray-800 text-sm uppercase tracking-wide">Comunidad</p>
                  <p className="font-bold text-gray-900 text-2xl">Expertos NoCode IA</p>
                </div>
                <div className="text-center mb-5">
                  <p className="font-bold text-xl text-gray-700">
                    <span className="line-through text-red-600">$1,997</span> → <span className="text-gray-900 text-2xl">$297</span>
                  </p>
                  <p className="text-[13px] text-gray-500 mt-1">Precio de lanzamiento</p>
                </div>
                <div className="border-2 border-dashed border-green-600 rounded-lg p-6 mb-6" style={{ backgroundColor: '#e3fae1' }}>
                  <p className="font-bold text-green-700 text-center text-sm uppercase tracking-wide mb-3">Precio de lanzamiento</p>
                  <p className="text-[15px] text-gray-700 text-center">Pago mensual</p>
                  <p className="font-bold text-green-800 text-center text-3xl sm:text-4xl mt-0.5">$39 USD/mes</p>
                  <p className="text-[14px] text-gray-600 text-center mt-3">o</p>
                  <p className="text-[15px] text-gray-700 text-center mt-1">Pago anual</p>
                  <p className="font-bold text-green-800 text-center text-4xl sm:text-[2.5rem] mt-0.5">$297</p>
                  <p className="text-[13px] text-green-700 text-center mt-1">(precio de lanzamiento)</p>
                </div>
                <a href={getAppUrl('/planes')} className="block w-full">
                  <button type="button" className="w-full py-5 rounded-full bg-[#63d059] hover:bg-[#52b848] font-sora font-bold text-[20px] text-black uppercase tracking-wide border-2 border-black border-b-4 border-b-black transition-colors">
                    QUIERO INSCRIBIRME
                  </button>
                </a>
                <p className="text-[13px] text-gray-500 text-center uppercase tracking-wider mt-4">Pago mensual o anual</p>
              </div>
            </div>
            </div>
          </div>

          {/* Abajo: 3 bloques de confianza */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full border-2 border-purple-500 flex items-center justify-center mb-3 bg-black/40">
                <Lock className="h-7 w-7 text-purple-400" />
              </div>
              <h4 className="font-sora font-bold text-[16px] text-gray-200 uppercase tracking-wide mb-2">Pago seguro</h4>
              <p className="font-albert text-[14px] text-gray-400">Entorno seguro. Tus datos están protegidos y tu compra es 100% segura.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full border-2 border-purple-500 flex items-center justify-center mb-3 bg-black/40">
                <Zap className="h-7 w-7 text-purple-400" />
              </div>
              <h4 className="font-sora font-bold text-[16px] text-gray-200 uppercase tracking-wide mb-2">Acceso inmediato</h4>
              <p className="font-albert text-[14px] text-gray-400">Tu usuario y contraseña se envían a tu correo poco después del pago.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full border-2 border-purple-500 flex items-center justify-center mb-3 bg-black/40">
                <Shield className="h-7 w-7 text-purple-400" />
              </div>
              <h4 className="font-sora font-bold text-[16px] text-gray-200 uppercase tracking-wide mb-2">Garantía de 30 días</h4>
              <p className="font-albert text-[14px] text-gray-400">Puedes solicitar un reembolso del 100% dentro de ese período.</p>
            </div>
          </div>

          {/* Newsletter CTA dentro del mismo contenedor negro - estilo imagen 1: input blanco + botón oscuro unidos */}
          <div className="mt-16 max-w-xl mx-auto">
            <Card className="bg-gray-900/80 border-purple-500/30">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-white mb-2">¿No estás listo para la membresía completa?</CardTitle>
                <CardDescription className="text-gray-300">Recibe tips semanales de NoCode e IA por email</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleNewsletterSubmit} className="flex rounded-xl border border-gray-400/60 overflow-hidden bg-white shadow-inner max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="Dirección de correo electrónico"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 border-0 bg-white text-gray-900 placeholder:text-gray-400 rounded-none min-h-12 focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={isNewsletterSubmitting}
                  />
                  <Button
                    type="submit"
                    className="rounded-none bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 min-h-12 gap-2 shrink-0"
                    disabled={isNewsletterSubmitting}
                  >
                    {isNewsletterSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        Suscribir
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Yo asumo todo el riesgo - estilo imagen: fondo blanco grid, badge dorado, card blanca */}
      <section
        className="py-16 sm:py-20 px-4 bg-white relative overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      >
        <div className="container mx-auto max-w-3xl relative z-10 text-center">
          <h2 className="font-sora font-bold text-black mb-1 tracking-tight text-xl sm:text-[36px] sm:leading-tight" style={{ letterSpacing: '-0.03em' }}>Y lo más increíble:</h2>
          <h2 className="font-sora font-bold text-purple-600 uppercase tracking-tight mb-10 text-2xl sm:text-[48px] leading-tight">¡Yo asumo todo el riesgo!</h2>

          {/* Sello de garantía: imagen, mitad superpuesta a la card */}
          <div className="relative z-20 flex justify-center mb-[-4rem] sm:mb-[-5rem]">
            <img
              src="/sello-garantia-15-dias.png"
              alt="Garantía 15 días - Tu dinero de vuelta"
              className="w-40 h-40 sm:w-52 sm:h-52 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
            />
          </div>

          {/* Card blanca con borde negro: padding-top para que el sello no tape el texto */}
          <div className="bg-white rounded-2xl border-2 border-black border-b-4 border-b-black shadow-md pt-16 sm:pt-20 pb-5 sm:pb-6 px-6 sm:px-8 mb-10 text-center max-w-3xl mx-auto relative z-10">
            <h3 className="font-sora font-bold text-black mb-4" style={{ fontFamily: "'Sora Variable', 'Sora', sans-serif", fontSize: '22px', lineHeight: 1.2, letterSpacing: '-0.04em' }}>Te ofrezco una garantía de 15 días, 100% libre de riesgos.</h3>
            <p className="font-albert text-gray-700 leading-relaxed" style={{ fontSize: '18px', letterSpacing: '-0.02em' }}>
              Podrás acceder al curso, ver las clases, descargar todos los materiales y... si ves que no es lo que buscabas, te devuelvo el 100% de tu dinero. Todo. Sin burocracia.
            </p>
          </div>

          <a href={getAppUrl('/planes')}>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#63d059] hover:bg-[#52b848] font-sora font-bold text-[20px] text-black px-10 py-5 border-2 border-black border-b-4 border-b-black transition-colors">
              Quiero registrarme
              <ArrowRight className="h-5 w-5 text-black" />
            </button>
          </a>
        </div>
      </section>

      {/* ¿Y los alumnos? - fondo #004fbe con grid 56px como "Yo asumo todo el riesgo" */}
      <section
        className="py-16 sm:py-20 px-4 relative overflow-hidden"
        style={{
          backgroundColor: '#004fbe',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      >
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">¿Y los alumnos? ¿Están logrando sus objetivos?</h2>
            <p className="text-white/80">Conoce a profesionales que ya transformaron su carrera</p>
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

          {/* Carrusel a ancho completo (de borde a borde de la pantalla) */}
          <style>{`
            @keyframes carousel-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <div className="w-screen relative left-1/2 -translate-x-1/2 mt-14 overflow-hidden">
            <div className="flex w-max gap-5" style={{ animation: 'carousel-scroll 40s linear infinite' }}>
              {[...testimonialsCarousel, ...testimonialsCarousel].map((item, i) => (
                <div key={i} className="flex-shrink-0 w-[150px] rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-gray-900/50">
                  <div className="relative aspect-[9/12]">
                    <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-4 px-4">
                      <p className="font-semibold text-white text-sm">{item.name}</p>
                      <p className="text-white/95 text-sm leading-snug mt-1 line-clamp-3">{item.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sección Fundador - arriba de FAQ (foto en public/fundador.webp) */}
      <section
        className="py-16 sm:py-20 px-4 relative overflow-hidden"
        style={{
          backgroundColor: '#0a0a0a',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      >
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Columna izquierda: texto */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-4xl sm:text-5xl font-medium italic text-purple-400" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                Fabián Segura
              </h2>
              <p className="font-sora font-bold text-white text-xl">
                CEO Agencia de No Code - Fundador de Expertos NoCode IA
              </p>
              <p className="text-gray-300 text-base leading-relaxed">
                Ha trabajado con más de 120 clientes creando soluciones No Code, automatizaciones y sitios web con desarrollos de IA que generan resultados reales.
              </p>
              <p className="text-gray-300 text-base leading-relaxed">
                Hoy Fabián se centra en agentes de IA y automatizaciones con N8N y OpenAI, y desde Expertos NoCode IA comparte ese conocimiento con la comunidad.
              </p>
              {/* Badges embajador */}
              <div className="flex flex-wrap gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-purple-500/40 text-white text-sm font-medium">
                  <Heart className="h-4 w-4 text-pink-400" />
                  Embajador Lovable
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500/20 border border-orange-400/50 text-orange-200 text-sm font-medium">
                  <Zap className="h-4 w-4 text-orange-400" />
                  Embajador n8n
                </span>
              </div>
            </div>
            {/* Columna derecha: foto con marco (public/fundador.webp) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end overflow-visible">
              <div className="relative w-full max-w-sm origin-center -rotate-[6deg] p-2 sm:p-2.5 bg-white rounded-[2rem] rounded-tl-[2.5rem] rounded-br-[1.75rem] shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
                <div className="relative w-full aspect-[4/3] rounded-[1.25rem] rounded-tl-[1.5rem] rounded-br-[1rem] overflow-hidden">
                  <img
                    src="/fundador.webp"
                    alt="Fabián Segura - CEO Agencia de No Code, Fundador de Expertos NoCode IA"
                    className="w-full h-full object-cover object-center block"
                    decoding="async"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      const fallback = el.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 bg-gray-800/90 flex items-center justify-center text-gray-400 text-sm p-6 text-center">
                    Sube la foto en <code className="block mt-2 bg-gray-700 px-2 py-1 rounded">public/fundador.webp</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - mismo fondo negro con cuadrícula que la biografía */}
      <section
        className="py-16 sm:py-20 px-4 relative overflow-hidden"
        style={{
          backgroundColor: '#0a0a0a',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      >
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-sora text-[48px] font-bold tracking-tight mb-4 text-white">Preguntas Frecuentes</h2>
            <p className="text-gray-400">Todo lo que necesitas saber antes de empezar</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="w-full max-w-[896px] mx-auto border-gray-700 overflow-hidden" style={{ backgroundColor: '#1c1c1c' }}>
                <CardHeader
                  className="cursor-pointer flex flex-row items-center px-4 sm:px-6 py-4 min-h-[59px]"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between gap-3 w-full min-w-0">
                    <CardTitle className="text-white text-left font-sora text-[16px] sm:text-[18px] min-w-0 flex-1 break-words pr-2">{faq.question}</CardTitle>
                    <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#11110f' }}>
                      {openFaq === index ? (
                        <Minus className="h-4 w-4" style={{ color: '#af72f3' }} />
                      ) : (
                        <Plus className="h-4 w-4" style={{ color: '#af72f3' }} />
                      )}
                    </span>
                  </div>
                </CardHeader>
                {openFaq === index && (
                  <CardContent>
                    <CardDescription className="text-gray-300 font-albert text-[14px] whitespace-pre-line">
                      {faq.answer}
                    </CardDescription>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* ¿Tienes alguna pregunta restante? - dentro del mismo fondo negro */}
          <div className="mt-16 text-center max-w-2xl mx-auto">
            <h2 className="font-bold text-[36px] mb-4 text-white">¿Tienes alguna pregunta restante?</h2>
            <p className="font-albert text-[18px] text-gray-400 mb-4">Si tienes alguna pregunta sobre la Comunidad No-Code, tenemos un equipo listo para ayudarte y responder cualquier duda en WhatsApp.</p>
            <p className="font-albert text-[18px] text-gray-400 mb-6">Simplemente toque el botón a continuación y llámenos.</p>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-[#63d059] hover:bg-[#52b848] font-sora font-bold text-[20px] text-black rounded-full border-2 border-black border-b-4 border-b-black px-10 py-6 transition-colors">
                <MessageCircle className="mr-2 h-5 w-5 text-black" />
                Hablar con nosotros
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Cierre motivacional + CTA final - fondo blanco con cuadrícula (1270×703) */}
      <section
        className="py-16 sm:py-20 px-4 bg-white relative overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      >
        <div className="container mx-auto relative z-10 text-left w-full max-w-[1270px] min-h-[520px] flex flex-col justify-center">
          <h2 className="font-sora text-2xl sm:text-[48px] font-bold tracking-tighter mb-6 text-black text-center leading-tight">
            <span style={{ color: '#b36cf6' }}>¡Basta</span> de dejarlo para después!
          </h2>
          <div className="font-albert text-[18px] text-gray-700 text-left max-w-3xl mx-auto mb-8 space-y-1 leading-snug">
            <p>Ahora tienes toda la información que necesitas para dar el siguiente paso.</p>
            <p>El mercado está en auge, las herramientas están a tu alcance y el método está probado.</p>
            <p>La única barrera que existía entre usted y esta oportunidad ya no existe.</p>
            <p>La cuestión ahora ya no es una cuestión de conocimientos o habilidades técnicas.</p>
            <p className="font-bold">Es cuestión de decisión.</p>
            <p>Mientras usted está sentado allí pensando, cientos de empresas están buscando exactamente lo que usted puede ofrecer: aplicaciones y agentes de IA, sin complejidad.</p>
            <p>Y la competencia todavía es mínima.</p>
            <p>Únase hoy a la comunidad No-Code IA y comience a crear aplicaciones y agentes de IA rentables hoy mismo.</p>
            <p>En 30 días, usted podrá estar cerrando su primer proyecto de $5.000 USD.</p>
            <p>En 90 días podrías tener una cartera de clientes recurrentes.</p>
            <p>O puedes quedarte exactamente donde estás ahora, viendo como otros se suben a esta ola.</p>
            <p className="font-bold">La decisión es tuya. Y el momento es ahora.</p>
          </div>
          <div className="text-center">
            <a href={getAppUrl('/planes')} className="inline-block">
              <Button size="lg" className="bg-[#63d059] hover:bg-[#52b848] font-sora font-bold text-[20px] text-black rounded-full border-2 border-black border-b-4 border-b-black px-10 py-6 transition-colors">
                ¡Genial! ¡Ya me decidí!
                <ArrowRight className="ml-2 h-5 w-5 text-black" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Pie de página - mismo fondo que Preguntas Frecuentes (estilo imagen) */}
      <footer
        className="py-16 px-4 relative overflow-hidden"
        style={{
          backgroundColor: '#0a0a0a',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      >
        <div className="container mx-auto max-w-4xl relative z-10">
          {/* Bloque superior centrado: logo + titular + párrafo */}
          <div className="text-center mb-14">
            <div className="flex justify-center mb-6">
              <img src="/logo-hero.png" alt="Expertos NoCode IA" className="h-14 sm:h-16 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
              <span className="hidden w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><Target className="h-6 w-6 text-white" /></span>
            </div>
            <h2 className="font-sora text-[16px] font-bold text-white tracking-tighter leading-tight mb-4 uppercase">
              La que será la comunidad No Code IA más grande de Latinoamérica.
            </h2>
            <p className="font-albert text-[14px] text-gray-300 max-w-2xl mx-auto leading-snug">
              Únete a la <span style={{ color: '#60d258' }}>comunidad</span> de emprendedores,
              <br />
              desarrolladores y administradores de IA. Que están
              <br />
              transformando sus ideas en negocios digitales rentables.
            </p>
          </div>
          {/* Barra inferior: empresa a la izquierda, enlaces legales a la derecha */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-700 text-sm text-gray-400">
            <div className="text-center sm:text-left">
              <p className="text-white font-medium">Expertos NoCode IA</p>
              <p className="text-gray-500 text-xs mt-0.5">NIT / RUC según país</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Link href="/politica-privacidad" className="hover:text-white transition-colors">Política de privacidad</Link>
              <Link href="/condiciones-servicio" className="hover:text-white transition-colors">Condiciones de servicio</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Botón flotante WhatsApp - ¿Necesitas ayuda? (más compacto en móvil) */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-1.5 sm:gap-2 bg-[#63d059] hover:bg-[#52b848] text-white font-sora font-bold text-sm sm:text-base px-3 py-2 sm:px-5 sm:py-3 rounded-full shadow-lg border-2 border-black border-b-4 border-b-black transition-colors"
      >
        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white shrink-0" />
        ¿Necesitas ayuda?
      </a>
    </div>
  );
}

