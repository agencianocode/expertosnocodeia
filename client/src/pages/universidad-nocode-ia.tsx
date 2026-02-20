import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  CheckCircle, 
  Code2, 
  Users, 
  BookOpen,
  Play,
  Star,
  Building2,
  BarChart3,
  Zap,
  Target,
  Lightbulb,
  Clock,
  Award,
  Globe,
  Video,
  MessageCircle,
  TrendingUp,
  Calendar
} from "lucide-react";

export default function UniversidadNoCodeIA() {
  const companies = [
    { name: "Google", logo: "https://cdn.prod.website-files.com/67ab272a36622522cbb3ba8f/67ab54e492157fb1f222485a_google.png" },
    { name: "Meta", logo: "https://cdn.prod.website-files.com/67ab272a36622522cbb3ba8f/67ab54e4121a347e91e20453_meta.png" },
    { name: "Microsoft", logo: "https://cdn.prod.website-files.com/67ab272a36622522cbb3ba8f/67ab54e4fd209d9074bbe5e8_microsoft.png" },
    { name: "HubSpot", logo: "https://cdn.prod.website-files.com/67ab272a36622522cbb3ba8f/67ab54e4e53c5e273485f308_hubspot.png" },
  ];

  const courses = [
    {
      id: "nocode-starter",
      title: "Kit de Inicio NoCode",
      description: "Comprende los fundamentos del NoCode, encuentra las mejores herramientas para tus necesidades e implementa casos de uso reales para ser más productivo en el trabajo.",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=250&fit=crop",
      duration: "6 semanas",
      modules: 12,
      level: "Principiante"
    },
    {
      id: "nocode-marketing",
      title: "NoCode para Marketing",
      description: "Genera conceptos visuales al instante, automatiza divulgación personalizada y desbloquea insights estratégicos con flujos de trabajo impulsados por IA.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
      duration: "8 semanas",
      modules: 16,
      level: "Intermedio"
    },
    {
      id: "nocode-business",
      title: "NoCode para Operaciones Empresariales",
      description: "Optimiza procesos, mejora la toma de decisiones y automatiza tareas rutinarias con sistemas impulsados por IA que aumentan tu eficiencia operacional.",
      image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=250&fit=crop",
      duration: "10 semanas",
      modules: 20,
      level: "Avanzado"
    },
    {
      id: "nocode-content",
      title: "NoCode para Creación de Contenido",
      description: "Supera los bloqueos creativos, genera visuales atractivos al instante y escala la producción de contenido con flujos de trabajo impulsados por IA.",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=250&fit=crop",
      duration: "6 semanas",
      modules: 14,
      level: "Intermedio"
    }
  ];

  const guides = [
    {
      id: "1",
      title: "Cómo intercambiar productos en cualquier video con Bubble",
      description: "La nueva función Multi Elements de Bubble te permite agregar, quitar o reemplazar fácilmente cualquier objeto en videos con tus propios productos.",
      categories: ["Creación de Contenido", "Diseño", "Marketing"],
      author: "Dr. Carlos Experto",
      image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop"
    },
    {
      id: "2",
      title: "Crea asistentes especializados con Zapier Workspaces",
      description: "La nueva función Workspaces de Zapier te permite crear asistentes de IA dedicados para tareas específicas como revisar contratos.",
      categories: ["Legal", "Consultoría", "Gestión de Proyectos"],
      author: "Dr. Carlos Experto",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop"
    },
    {
      id: "3",
      title: "Convierte tu terminal en un agente de desarrollo NoCode",
      description: "Aprende a instalar y usar el nuevo agente de desarrollo que funciona en tu terminal, permitiéndote explicar y crear flujos usando comandos naturales.",
      categories: ["Desarrollo", "Educación", "Estudiante"],
      author: "Dr. Carlos Experto",
      image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop"
    }
  ];

  const workshops = [
    {
      id: "bubble-apps",
      title: "Construcción y Monetización de Apps con Bubble",
      description: "Más allá de lo básico, esta sesión avanzada te enseñará cómo construir aplicaciones móviles robustas usando Bubble, con implementación práctica de servicios backend.",
      date: "4 de febrero, 2025 • 9:00 PM ET",
      attendees: "100+ Asistentes",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop"
    },
    {
      id: "zapier-automation",
      title: "Cómo Automatizar Tareas con Zapier",
      description: "Aprende a aprovechar el nuevo asistente de Zapier para tareas prácticas como enviar formularios, aplicar a trabajos y hacer pedidos.",
      date: "31 de enero, 2025 • 9:00 PM ET",
      attendees: "100+ Asistentes",
      image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=200&fit=crop"
    }
  ];

  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Crea tu propio camino",
      description: "Completa un quiz rápido para desbloquear un currículum personalizado basado en tu industria, estilo de aprendizaje y nivel de experiencia."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Aprende de los expertos",
      description: "Obtén acceso directo a los fundadores y educadores que están dando forma al futuro del NoCode para aprender secretos de automatización."
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Mantente a la vanguardia",
      description: "Aplica cualquiera de nuestras guías paso a paso para implementar herramientas y flujos de trabajo NoCode en 15 minutos o menos."
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Aprovecha nuestra red",
      description: "Benefíciate de flujos de trabajo colaborativos de una comunidad de 500,000+ profesionales y descuentos en herramientas líderes."
    }
  ];

  const pricingPlans = [
    {
      name: "Prueba Gratis",
      price: "$0",
      period: "/14 días",
      description: "Desbloquear el acceso a:",
      features: [
        "5-10 casos de uso de IA",
        "Cursos de IA certificados para la industria seleccionada",
        "Guías diarias paso a paso",
        "Talleres semanales dirigidos por expertos (solo en vivo)",
        "Comunidad privada"
      ],
      popular: false
    },
    {
      name: "Mensual",
      price: "$39",
      period: "/mes",
      description: "Perfecto para empezar",
      features: [
        "Acceso completo a la universidad",
        "300+ guías paso a paso",
        "Workshops en vivo semanales",
        "Comunidad privada",
        "Certificados de finalización",
        "Descuentos en herramientas"
      ],
      popular: false
    },
    {
      name: "Anual",
      price: "$299",
      period: "/año",
      description: "Mejor valor - Ahorra $169",
      features: [
        "Todo lo incluido en Mensual",
        "2 meses GRATIS",
        "Acceso prioritario a workshops",
        "Sesiones 1:1 mensuales",
        "Recursos exclusivos",
        "Garantía de 30 días"
      ],
      popular: true
    }
  ];

  const testimonials = [
    {
      name: "Joseph Lacovara",
      text: "Esto es genial para cualquiera interesado en NoCode — no se necesita conocimiento técnico. Lo recomiendo mucho y actualmente me estoy preparando para tomar el examen de certificación.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Reid Manning",
      text: "Gracias por las fantásticas lecciones que tienen aquí en su sitio web de universidad NoCode. Acabo de empezar en una nueva empresa y ya estoy superando sus expectativas.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Wouter Teunissen",
      text: "La Universidad NoCode me abrió los ojos a lo que es posible. Después de solo un par de días de aprendizaje, creé un agente de IA que responde a mis correos. Un cambio de juego para mi negocio.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-8 py-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Expertos NoCode IA</span>
              </div>
            </Link>
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/universidad-nocode-ia" className="text-gray-300 hover:text-white transition-colors text-sm">
                Universidad
              </Link>
              <Link href="/#articulos" className="text-gray-300 hover:text-white transition-colors text-sm">
                Artículos
              </Link>
              <Link href="/#guias" className="text-gray-300 hover:text-white transition-colors text-sm">
                Guías
              </Link>
              <Link href="/#herramientas" className="text-gray-300 hover:text-white transition-colors text-sm">
                Herramientas
              </Link>
              <Link href="/cursos" className="text-gray-300 hover:text-white transition-colors text-sm">
                Cursos
              </Link>
              <Link href="/talleres" className="text-gray-300 hover:text-white transition-colors text-sm">
                Talleres
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800 text-sm"
                onClick={() => window.location.href = '/api/login'}
              >
                Iniciar Sesión →
              </Button>
            </nav>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-black text-sm font-bold">R</span>
            </div>
            <span className="text-2xl font-bold text-white font-satoshi"><span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Universidad</span> NoCode IA</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white font-satoshi">
            Educación en NoCode IA para el futuro del trabajo.
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto font-satoshi">
            Accede a certificaciones específicas por industria, cientos de guías paso a paso y workshops en vivo con expertos para acelerar tu carrera.
          </p>
          <div className="mb-8">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
              Prueba gratis por 14 días
            </Button>
          </div>
          <p className="text-gray-400 mb-8 font-satoshi">
            Confiado por profesionales y socios de las mejores empresas de tecnología:
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {companies.map((company) => (
              <img 
                key={company.name}
                src={company.logo} 
                alt={company.name}
                className="h-8 object-contain filter grayscale hover:filter-none transition-all"
              />
            ))}
          </div>
        </div>
      </section>
      {/* Problem Statement */}
      <section className="py-16 px-4 bg-[#ffffff] text-[#000000]">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="md:text-4xl font-bold mb-6 font-satoshi ml-[17px] mr-[17px] text-[45px] text-[#0b0b0b]">
            El mundo del NoCode se mueve demasiado rápido para navegarlo solo.
          </h2>
          <div className="space-y-6 text-lg max-w-3xl mx-auto text-[#000000]">
            <p className="font-satoshi text-[20px]">
              El potencial del NoCode es innegable.
            </p>
            <p className="font-satoshi text-[20px]">
              Pero la mayoría de los profesionales se atascan tratando de descifrar herramientas infinitas, tutoriales desactualizados y jerga técnica — sin una dirección clara sobre lo que realmente funciona para sus necesidades específicas.
            </p>
            <p className="font-satoshi text-[20px] ml-[80px] mr-[80px]">Entonces esa abrumación e incertidumbre 
            les impide implementar NoCode en su trabajo.</p>
            <p className="font-semibold font-satoshi text-[22px] text-[#0b0b0b]">
              La Universidad NoCode IA proporciona una experiencia de aprendizaje personalizada y dirigida por expertos que se ajusta a tu horario ocupado.
            </p>
          </div>
        </div>
      </section>
      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 border border-gray-200">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-black font-satoshi">{feature.title}</h3>
                <p className="text-gray-600 font-satoshi leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-satoshi">
              Desbloquea mi recorrido de aprendizaje personalizado
            </Button>
          </div>
        </div>
      </section>
      {/* Courses */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-black font-satoshi">
              Acelere su crecimiento profesional con nuestros <br />
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">cursos de certificación</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto font-satoshi text-lg leading-relaxed">
              Acceda a una biblioteca en crecimiento de cursos integrales de certificación en IA específicos de la industria para ponerse al día con los profesionales y demostrar exactamente lo que lo hace destacar en el lugar de trabajo.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="bg-black rounded-xl overflow-hidden border-0 hover:scale-105 transition-all duration-300 group cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6 text-white">
                  <h3 className="text-lg font-bold mb-3 font-satoshi">
                    {course.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-4 font-satoshi leading-relaxed">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0">
                      KIT CERTIFICACIÓN
                    </Badge>
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-xs">📜</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button className="bg-white border border-gray-300 text-black hover:bg-gray-50 px-8 py-3 rounded-full font-satoshi">
              Ver todos los cursos →
            </Button>
          </div>

          {/* Testimonial */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 relative">
              <div className="absolute -top-6 left-8">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">"</span>
                </div>
              </div>
              <div className="flex justify-start mb-4 pt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-lg text-black font-satoshi mb-6 leading-relaxed">
                Esto es ideal para cualquier persona interesada en la IA; no se necesitan conocimientos técnicos. Lo recomiendo ampliamente y actualmente me estoy preparando para presentar el examen de certificación.
              </blockquote>
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face"
                  alt="José Lacovara"
                  className="w-12 h-12 rounded-full"
                />
                <span className="font-bold text-black font-satoshi">José Lacovara</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Guides */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-black font-satoshi">
              Resuelva problemas del mundo real con <br />
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">guías</span> paso
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto font-satoshi text-lg leading-relaxed">
              Acceda a más de 300 lecciones prácticas en video inspiradas por usuarios pioneros de diferentes industrias, con nuevas guías creadas diariamente para mantenerlo constantemente actualizado y transformar su forma de trabajar.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guides.map((guide) => (
              <Card key={guide.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:scale-105 transition-all duration-300 group cursor-pointer shadow-sm">
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={guide.image} 
                    alt={guide.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-3 text-black font-satoshi">
                    {guide.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 font-satoshi leading-relaxed">{guide.description}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {guide.categories.map((category) => (
                      <Badge key={category} className="bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 border-0">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face"
                      alt="Dr. Álvaro Cimas"
                      className="w-6 h-6 rounded-full"
                    />
                    <p className="text-xs text-gray-500 font-satoshi">Dr. Álvaro Cimas</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button className="bg-white border border-gray-300 text-black hover:bg-gray-50 px-8 py-3 rounded-full font-satoshi">
              Ver todas las guías →
            </Button>
          </div>

          {/* Testimonial */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 relative">
              <div className="absolute -top-6 left-8">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">"</span>
                </div>
              </div>
              <div className="flex justify-start mb-4 pt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-lg text-black font-satoshi mb-6 leading-relaxed">
                Gracias por las fantásticas lecciones que ofrecen en el sitio web de su universidad de IA. Acabo de empezar en una nueva empresa, trabajando en el diseño y desarrollo de la interfaz de un portal web de salud, y ya estoy superando sus expectativas.
              </blockquote>
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face"
                  alt="Reid Manning"
                  className="w-12 h-12 rounded-full"
                />
                <span className="font-bold text-black font-satoshi">Reid Manning</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Workshops */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-black font-satoshi">
              Aprenda directamente de expertos en IA con <br />
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">talleres dirigidos por expertos</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto font-satoshi text-lg leading-relaxed">
              Únase a sesiones interactivas semanales en vivo con líderes de la industria que están a la vanguardia de la innovación en IA para obtener orientación práctica sobre la implementación y conocimientos exclusivos.
            </p>
          </div>

          {/* Partner logos */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-12">
            <div className="grayscale opacity-70">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/120px-Meta_Platforms_Inc._logo.svg.png" alt="Meta" className="h-8" />
            </div>
            <div className="bg-gray-200 px-4 py-2 rounded text-gray-600 font-medium">KLING AI</div>
            <div className="bg-gray-200 px-4 py-2 rounded text-gray-600 font-medium">windsurf</div>
            <div className="bg-gray-200 px-4 py-2 rounded text-gray-600 font-medium font-bold">bolt</div>
            <div className="bg-gray-200 px-4 py-2 rounded text-gray-600 font-medium">Lindy</div>
            <div className="bg-gray-200 px-4 py-2 rounded text-gray-600 font-medium">Poe</div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 mb-8">
            {workshops.map((workshop) => (
              <div key={workshop.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex">
                  <div className="flex-1">
                    <div className="aspect-video bg-gray-900 flex items-center justify-center relative overflow-hidden">
                      <img 
                        src={workshop.image} 
                        alt={workshop.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-white text-center p-4">
                          <div className="text-sm font-medium mb-2 text-blue-400">GoFire</div>
                          <h3 className="text-lg font-bold mb-2">How to build and monetize mobile apps using AI</h3>
                          <div className="text-sm opacity-80">LIVE STREAMED • 100+ ATTENDEES</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-6">
                    <div className="text-sm text-gray-500 mb-2">{workshop.date}</div>
                    <h3 className="text-xl font-bold mb-3 text-black font-satoshi">
                      {workshop.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 font-satoshi">
                      {workshop.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span>📺 Transmisión en vivo</span>
                      <span>👥 Más de 100 asistentes</span>
                    </div>
                    <Button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded text-sm font-satoshi">
                      Más información →
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center text-gray-600">
            <p className="mb-4 font-satoshi">Todos los talleres incluyen presentaciones, sesiones de preguntas y respuestas y una demostración. Las grabaciones previas se almacenan en la Universidad.</p>
          </div>

          <div className="text-center mt-8">
            <Button className="bg-white border border-gray-300 text-black hover:bg-gray-50 px-8 py-3 rounded-full font-satoshi">
              Ver todos los talleres →
            </Button>
          </div>

          {/* Testimonial */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 relative">
              <div className="absolute -top-6 left-8">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">"</span>
                </div>
              </div>
              <div className="flex justify-start mb-4 pt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-lg text-black font-satoshi mb-6 leading-relaxed">
                El Blueprint me abrió los ojos a las posibilidades de la IA. Al principio solo probé un par de herramientas de IA, pero no las usaba realmente en mi trabajo — y después de solo unos días de aprendizaje, creé un agente de IA que responde a mis correos electrónicos en mi nombre. Un punto de inflexión para mi negocio.
              </blockquote>
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face"
                  alt="Wouter Teunissen"
                  className="w-12 h-12 rounded-full"
                />
                <span className="font-bold text-black font-satoshi">Wouter Teunissen</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Community Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-black font-satoshi">
              Encuentre conexiones valiosas dentro de una <br />
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">comunidad de primeros usuarios</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto font-satoshi text-lg leading-relaxed">
              Aprenda de las lecciones, oportunidades y logros de una comunidad creciente de profesionales que ya están trabajando más rápido e inteligentemente con NoCode.
            </p>
          </div>

          <div className="space-y-8">
            {/* First Testimonial */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 relative">
              <div className="absolute -top-6 left-8">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">"</span>
                </div>
              </div>
              <div className="flex justify-start mb-4 pt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-lg text-black font-satoshi mb-6 leading-relaxed">
                Con descripciones generales y análisis a fondo de todos los áreas de la IA, no hay mejor manera de mantenerse relevante y al día con las mejores formas de implementar estas nuevas tecnologías en nuestras vidas. Si tienes preguntas específicas o buscas oportunidades para hacer networking, este es el lugar para estar.
              </blockquote>
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face"
                  alt="Blake Moore"
                  className="w-12 h-12 rounded-full"
                />
                <span className="font-bold text-black font-satoshi">Blake Moore</span>
              </div>
            </div>

            {/* Second Testimonial */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 relative">
              <div className="absolute -top-6 left-8">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">"</span>
                </div>
              </div>
              <div className="flex justify-start mb-4 pt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-lg text-black font-satoshi mb-6 leading-relaxed">
                Esto es perfecto para cualquiera que esté en cierto nivel de experticia. El contenido no está dirigido a personas totalmente nuevas y con la formación. Me encantó el agregador de contenido como empresario.
              </blockquote>
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face"
                  alt="Adriane Cervigel"
                  className="w-12 h-12 rounded-full"
                />
                <span className="font-bold text-black font-satoshi">Adriane Cervigel</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Perks */}
      <section className="py-16 px-4 bg-[#111111]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 font-satoshi">
              Construye un mejor stack tecnológico con beneficios exclusivos
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto font-satoshi">
              Aprovecha nuestra vasta red de asociaciones con las mejores empresas de NoCode para acceder a un número creciente de tarifas con descuento, pruebas extendidas y asignaciones de uso adicionales que valen más de $1000+.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              "Bubble", "Zapier", "Airtable", "Webflow", "Make", "Notion",
              "Typeform", "Calendly", "Loom", "Figma", "Canva", "Mailchimp"
            ].map((tool) => (
              <div key={tool} className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-gray-800">
                <div className="w-12 h-12 bg-gray-700 rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">{tool}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Elige tu plan</h2>
            <p className="text-gray-400 text-lg">Comienza tu viaje de aprendizaje NoCode hoy</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card key={plan.name} className={`relative ${
                plan.popular 
                  ? 'bg-gradient-to-b from-blue-600/20 to-purple-600/20 border-blue-500/50' 
                  : 'bg-[#1a1a1a] border-gray-800'
              }`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Más Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-lg text-gray-400">{plan.period}</span>
                  </div>
                  <p className="text-gray-400 mb-4">{plan.description}</p>
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    size="lg"
                  >
                    Empezar ahora
                  </Button>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">¿Tienes preguntas? Estamos aquí para ayudar.</p>
            <Button variant="outline">
              Contactar Soporte
            </Button>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 px-4 bg-[#0a0a0a]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-white font-satoshi">
              Preguntas que hicieron nuestros <br />
              miembros antes de unirse
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "¿Qué es exactamente Expertos NoCode IA?",
                answer: "Expertos NoCode IA es una plataforma de aprendizaje integral diseñada específicamente para profesionales que desean implementar la IA y NoCode en su trabajo diario. Combina cursos de certificación, guías diarias, talleres en vivo y una comunidad de pioneros para ayudarte a conectar con el entusiasmo por la IA y su implementación práctica."
              },
              {
                question: "Soy principiante absoluto en NoCode/IA. ¿Me ayudará esto?",
                answer: "¡Por supuesto! Nuestra plataforma está diseñada para usuarios principiantes y avanzados. Nuestros cursos de certificación proporcionan conocimientos básicos (que te ayudarán a progresar de cero a cien), mientras que nuestras guías y talleres te ayudan a implementar casos de uso específicos de inmediato. No necesitas conocimientos técnicos para empezar y ver resultados."
              },
              {
                question: "¿En qué se diferencia de otros cursos de NoCode en línea?",
                answer: "A diferencia de los cursos generales que se centran en la teoría o en aplicaciones genéricas, nuestras lecciones están diseñadas para su implementación inmediata en su profesión. Nos centramos en flujos de trabajo prácticos que puede usar hoy mismo y ofrecemos rutas de aprendizaje personalizadas, una comunidad de apoyo y acceso directo a expertos que otras plataformas simplemente no ofrecen."
              },
              {
                question: "¿Ofrecen certificaciones que pueda agregar a mi currículum?",
                answer: "Sí, todos nuestros cursos incluyen certificaciones que puedes añadir a tu perfil de LinkedIn y a tu currículum. Estas certificaciones demuestran a los empleadores que tienes habilidades prácticas de implementación de NoCode e IA que te distinguen de otros profesionales."
              },
              {
                question: "¿Puedo deducir esto como gasto a través de la empresa para la que trabajo?",
                answer: "Sí, Expertos NoCode IA se considera desarrollo profesional. Aproximadamente el 70% de nuestros miembros convencen a su empleador para que cubra su membresía con su presupuesto de Formación y Desarrollo o la deducen como gasto libre de impuestos en su propio negocio."
              },
              {
                question: "¿Con qué frecuencia se agrega contenido nuevo a la plataforma?",
                answer: "Publicamos nuevas guías paso a paso a diario y organizamos uno o dos talleres presenciales cada semana. Nuestro equipo monitorea constantemente los avances para garantizar que siempre estés al día con los flujos de trabajo de NoCode e IA más actualizados y valiosos."
              },
              {
                question: "¿Qué puedo esperar en los talleres de NoCode/IA?",
                answer: "Nuestros talleres son sesiones interactivas en vivo impartidas por expertos de importantes empresas de NoCode e IA. Cada taller se centra en un caso práctico específico con demostraciones prácticas, ejemplos reales y sesiones de preguntas y respuestas. Todos los talleres se graban para su visualización bajo demanda si no puede asistir en directo."
              },
              {
                question: "¿Cuánto tiempo necesito dedicar cada semana?",
                answer: "Nuestras lecciones están diseñadas para profesionales con mucha actividad. La mayoría de las guías se completan en 15-20 minutos, y los talleres suelen durar entre 60 y 90 minutos. Recomendamos reservar de 2 a 3 horas semanales para maximizar tu aprendizaje, pero la plataforma se adapta completamente a tu ritmo."
              },
              {
                question: "¿Puedo solicitar cursos o guías específicos?",
                answer: "¡Por supuesto! Nuestros miembros solicitan temas específicos a través de la sección de comentarios de nuestra plataforma. Luego, revisamos todas las solicitudes y priorizamos los temas y casos prácticos más solicitados. Muchas de nuestras guías más populares surgieron como sugerencias de nuestros miembros."
              },
              {
                question: "¿Ofrecen opciones de pago mensual?",
                answer: "Sí, ofrecemos tanto planes mensuales como anuales para adaptarnos a tus preferencias. También incluimos una prueba gratuita de 14 días que te permite evaluar si es la opción adecuada para ti antes de comprometerte con cualquier plan."
              },
              {
                question: "¿Sobre qué plataforma se basa Expertos NoCode IA?",
                answer: "Hemos desarrollado internamente una plataforma personalizada (¡con IA!) para crear rutas de aprendizaje verdaderamente personalizadas. Es accesible desde cualquier navegador web y funciona a la perfección en computadoras de escritorio y dispositivos móviles."
              },
              {
                question: "¿Ofrecen una garantía de devolución de dinero?",
                answer: "No se realizan reembolsos por los productos de Expertos NoCode IA una vez adquiridos. No se realizan reembolsos por el acceso a los productos una vez adquiridos. Una vez procesada una suscripción recurrente, Expertos NoCode IA no se responsabilizará de reembolsos bajo ninguna circunstancia, a menos que la cancelación se realice antes de la fecha de procesamiento. Para obtener ayuda, contáctenos en soporte@expertosnocodeia.com\n\nNota: Nuestra política de privacidad y términos actualizados entrarán en vigor el 1 de julio de 2025."
              }
            ].map((faq, index) => (
              <details key={index} className="bg-[#1a1a1a] rounded-lg border border-gray-800 group">
                <summary className="p-6 cursor-pointer flex justify-between items-center hover:bg-muted transition-colors">
                  <span className="text-white font-medium font-satoshi text-lg">{faq.question}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform duration-200">▼</span>
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-gray-300 font-satoshi leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-full font-satoshi text-lg"
              size="lg"
            >
              Únase a la Universidad NoCode IA
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-16 px-4 bg-gray-100 text-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <Link href="/">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">E</span>
                  </div>
                  <span className="text-lg font-bold text-black font-satoshi">Expertos NoCode IA</span>
                </div>
              </Link>
              <p className="text-gray-600 text-sm mb-6 max-w-md font-satoshi">
                Entérese de las últimas noticias de NoCode e IA, comprenda cómo implementarla y aprenda a aplicarla en su trabajo. Leído por más de 500,000 profesionales de empresas líderes en tecnología.
              </p>
              
              {/* Email Subscription */}
              <div className="flex gap-2 max-w-md">
                <input
                  type="email"
                  placeholder="Dirección de correo electrónico"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-satoshi"
                />
                <Button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded text-sm font-satoshi">
                  Suscribir
                </Button>
              </div>
            </div>

            {/* Manténgase actualizado */}
            <div>
              <h4 className="font-semibold mb-4 text-black font-satoshi">Manténgase actualizado</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="/" className="hover:text-black transition-colors font-satoshi">Artículos</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors font-satoshi">Podcast</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors font-satoshi">Guías</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors font-satoshi">Herramientas</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors font-satoshi">Talleres</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors font-satoshi">Bolsa de trabajo NoCode</Link></li>
              </ul>
            </div>

            {/* Universidad NoCode IA */}
            <div>
              <h4 className="font-semibold mb-4 text-black font-satoshi">Universidad NoCode IA</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="/universidad-nocode-ia" className="hover:text-black transition-colors font-satoshi">NoCode para empresas</Link></li>
                <li><Link href="/universidad-nocode-ia" className="hover:text-black transition-colors font-satoshi">NoCode para desarrollo</Link></li>
                <li><Link href="/universidad-nocode-ia" className="hover:text-black transition-colors font-satoshi">NoCode para contenido</Link></li>
                <li><Link href="/universidad-nocode-ia" className="hover:text-black transition-colors font-satoshi">NoCode para educación</Link></li>
                <li><Link href="/universidad-nocode-ia" className="hover:text-black transition-colors font-satoshi">NoCode para marketing</Link></li>
                <li><Link href="/universidad-nocode-ia" className="hover:text-black transition-colors font-satoshi">Todos los cursos</Link></li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="font-semibold mb-4 text-black font-satoshi">Empresa</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="/" className="hover:text-black transition-colors font-satoshi">Acerca de</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors font-satoshi">Contacto</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors font-satoshi">Privacidad</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors font-satoshi">Términos</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors font-satoshi">Newsletter</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-300 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm font-satoshi">© 2025 Expertos NoCode IA. Todos los derechos reservados.</p>
              <Link href="/" className="text-gray-500 hover:text-black transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}