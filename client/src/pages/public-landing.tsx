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
  FileText,
  MessageSquare
} from "lucide-react";

export default function PublicLanding() {
  const companies = [
    { name: "Google", logo: "https://cdn.prod.website-files.com/67ab272a36622522cbb3ba8f/67ab54e492157fb1f222485a_google.png" },
    { name: "Meta", logo: "https://cdn.prod.website-files.com/67ab272a36622522cbb3ba8f/67ab54e4121a347e91e20453_meta.png" },
    { name: "Microsoft", logo: "https://cdn.prod.website-files.com/67ab272a36622522cbb3ba8f/67ab54e4fd209d9074bbe5e8_microsoft.png" },
    { name: "HubSpot", logo: "https://cdn.prod.website-files.com/67ab272a36622522cbb3ba8f/67ab54e4e53c5e273485f308_hubspot.png" },
  ];

  const articles = [
    {
      id: "1",
      title: "Las mejores herramientas NoCode para 2025",
      excerpt: "PLUS: Bubble lanza nuevas funcionalidades de IA",
      category: "NoCode",
      author: "Expertos NoCode IA",
      readTime: "5 minutos",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=250&fit=crop"
    },
    {
      id: "2",
      title: "Automatización empresarial sin código",
      excerpt: "PLUS: Zapier integra GPT-4 para flujos inteligentes",
      category: "Automatización",
      author: "Expertos NoCode IA",
      readTime: "6 minutos",
      image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=250&fit=crop"
    },
    {
      id: "3",
      title: "Bubble vs FlutterFlow: Comparativa 2025",
      excerpt: "PLUS: Nuevas plantillas de aplicaciones móviles",
      category: "Herramientas",
      author: "Expertos NoCode IA",
      readTime: "7 minutos",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop"
    }
  ];

  const guides = [
    {
      id: "1",
      title: "Cómo crear una tienda online con Shopify y Zapier",
      description: "Automatiza completamente tu ecommerce sin escribir una línea de código",
      categories: ["Ecommerce", "Automatización", "Emprendimiento"],
      author: "Dr. Carlos Experto",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop"
    },
    {
      id: "2",
      title: "Automatiza tu marketing con Make.com y HubSpot",
      description: "Conecta todas tus herramientas de marketing para workflows automáticos",
      categories: ["Marketing", "Automatización", "CRM"],
      author: "Dr. Carlos Experto",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop"
    },
    {
      id: "3",
      title: "Crea aplicaciones móviles con FlutterFlow",
      description: "Desarrolla apps nativas sin conocimientos de programación",
      categories: ["Desarrollo", "Móvil", "Apps"],
      author: "Dr. Carlos Experto",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop"
    }
  ];

  const tools = [
    {
      name: "Bubble",
      description: "Plataforma líder para crear aplicaciones web sin código",
      category: "Desarrollo Web",
      icon: <Code2 className="h-6 w-6" />,
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&h=120&fit=crop"
    },
    {
      name: "Zapier",
      description: "Automatiza flujos de trabajo conectando miles de aplicaciones",
      category: "Automatización",
      icon: <Zap className="h-6 w-6" />,
      image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=200&h=120&fit=crop"
    },
    {
      name: "Airtable",
      description: "Base de datos visual con la potencia de una hoja de cálculo",
      category: "Gestión de Datos",
      icon: <BarChart3 className="h-6 w-6" />,
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&h=120&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-8 py-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Expertos NoCode IA</span>
            </div>
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/universidad-nocode-ia" className="text-gray-300 hover:text-white transition-colors text-sm">
                Universidad
              </Link>
              <Link href="#articulos" className="text-gray-300 hover:text-white transition-colors text-sm">
                Artículos
              </Link>
              <Link href="#guias" className="text-gray-300 hover:text-white transition-colors text-sm">
                Guías
              </Link>
              <Link href="#herramientas" className="text-gray-300 hover:text-white transition-colors text-sm">
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
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Aprenda NoCode e IA <br />
            con solo <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">5 minutos</span> al día
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Obtenga las últimas noticias sobre IA, comprenda por qué es importante y aprenda cómo aplicarla en su trabajo.
          </p>
          
          {/* Email Subscription Form */}
          <div className="mb-12 max-w-md mx-auto">
            <div className="flex bg-white rounded-full p-1">
              <input 
                type="email"
                placeholder="Dirección de correo electrónico"
                className="flex-1 px-4 py-3 text-gray-900 bg-transparent border-none outline-none placeholder-gray-500"
              />
              <Button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-full">
                Suscribir
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <p className="text-gray-400 mb-8">
            Únase a más de <span className="text-white font-bold">1,000,000</span> de lectores de empresas como:
          </p>
          
          {/* Company Logos */}
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
            <div className="text-white text-xl font-bold">Google</div>
            <div className="text-white text-xl font-bold">Meta</div>
            <div className="text-white text-xl font-bold">cisco</div>
            <div className="text-white text-xl font-bold">HubSpot</div>
            <div className="text-white text-xl font-bold tracking-widest">IBM</div>
            <div className="text-white text-xl font-bold">Microsoft</div>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section id="articulos" className="py-16 px-4 bg-white text-black">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-black">Últimos artículos</h2>
            <p className="text-gray-600 text-lg">Los últimos avances en IA, tecnología y robótica.</p>
          </div>
          
          {/* Filter Tags */}
          <div className="flex justify-center gap-3 mb-12">
            <div className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium">Todo</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">IA</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">Tecnología</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">Robótica</div>
          </div>
          
          {/* Articles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Article */}
            <div className="lg:col-span-6">
              <div className="group cursor-pointer">
                <div className="aspect-video overflow-hidden rounded-lg mb-4">
                  <img 
                    src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=300&fit=crop"
                    alt="Netflix se convierte en un parque temático completo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mb-3">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">Tecnología</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-black group-hover:text-blue-600 transition-colors">
                  Netflix se convierte en un parque temático completo
                </h3>
                <p className="text-gray-600 mb-3">ADEMÁS: SpaceX finalmente lanza la enorme Starship</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>Jennifer Montalvo</span>
                  <span className="mx-2">•</span>
                  <span>5 minutos</span>
                </div>
              </div>
            </div>
            
            {/* Side Articles */}
            <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group cursor-pointer">
                <div className="aspect-video overflow-hidden rounded-lg mb-3">
                  <img 
                    src="https://images.unsplash.com/photo-1676299081847-824916de030a?w=300&h=200&fit=crop"
                    alt="El debut de la IA de cosecha propia de Microsoft"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mb-2">
                  <span className="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">IA</span>
                </div>
                <h4 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors leading-tight">
                  El debut de la IA de cosecha propia de Microsoft
                </h4>
                <div className="flex items-center text-xs text-gray-500">
                  <span>Zach Mink</span>
                  <span className="mx-1">•</span>
                  <span>6 minutos</span>
                </div>
              </div>
              
              <div className="group cursor-pointer">
                <div className="aspect-video overflow-hidden rounded-lg mb-3">
                  <img 
                    src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&h=200&fit=crop"
                    alt="El cerebro robótico del tamaño de la palma de la mano de Nvidia"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mb-2">
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">Robótica</span>
                </div>
                <h4 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors leading-tight">
                  El cerebro robótico del tamaño de la palma de la mano de Nvidia
                </h4>
                <div className="flex items-center text-xs text-gray-500">
                  <span>Jennifer Montalvo</span>
                  <span className="mx-1">•</span>
                  <span>5 minutos</span>
                </div>
              </div>
              
              <div className="group cursor-pointer">
                <div className="aspect-video overflow-hidden rounded-lg mb-3">
                  <img 
                    src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=200&fit=crop"
                    alt="Clasificación de poder de las aplicaciones de IA"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mb-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">IA</span>
                </div>
                <h4 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors leading-tight">
                  Clasificación de poder de las aplicaciones de IA
                </h4>
                <div className="flex items-center text-xs text-gray-500">
                  <span>Zach Mink</span>
                  <span className="mx-1">•</span>
                  <span>7 minutos</span>
                </div>
              </div>
              
              <div className="group cursor-pointer">
                <div className="aspect-video overflow-hidden rounded-lg mb-3">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop"
                    alt="El modelo viral de Google cambia la edición de imágenes con IA"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mb-2">
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">IA</span>
                </div>
                <h4 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors leading-tight">
                  El modelo viral de Google cambia la edición de imágenes con IA
                </h4>
                <div className="flex items-center text-xs text-gray-500">
                  <span>Zach Mink</span>
                  <span className="mx-1">•</span>
                  <span>5 minutos</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-full">
              Ver todos los artículos →
            </Button>
          </div>
        </div>
      </section>

      {/* Guides Section */}
      <section id="guias" className="py-16 px-4 bg-white text-black">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-black">Guías</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Recopilamos los principales casos de uso de IA del mundo real entre nuestra audiencia de más de 1 millón de primeros usuarios, y creamos guías diarias sobre exactamente cómo copiarlos y aplicarlos a su trabajo.
            </p>
          </div>
          
          {/* Filter Tags - Multiple Rows */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <div className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium">Todo</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">💼 Codificación</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">📈 Marketing</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">🎨 Creador de contenido</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">🎓 Educador</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">💰 Ventas</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">🎨 Diseño</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">📊 Análisis de datos</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">📁 Gestión de proyectos</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">🏢 Consultante</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">💰 Finanzas</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">🏛️ Gobierno</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">🏥 Cuidado de la salud</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">⚖️ Legal</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">👥 Reclutamiento de RRHH</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">🎓 Alumno</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">📋 General</div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">🏢 Operaciones comerciales</div>
          </div>
          
          {/* Guides Grid - 4x2 Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=200&fit=crop"
                  alt="Cómo intercambiar productos en cualquier video con Kling AI"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors text-sm leading-tight">
                  Cómo intercambiar productos en cualquier video con Kling AI
                </h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Creador de contenido</span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Diseño</span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Marketing</span>
                </div>
                <p className="text-xs text-gray-500">Dr. Ádam Orosz</p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop"
                  alt="Crea asistentes legales especializados con Grok Workspaces"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors text-sm leading-tight">
                  Crea asistentes legales especializados con Grok Workspaces
                </h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Legal</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Consultante</span>
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Gestión de proyectos</span>
                </div>
                <p className="text-xs text-gray-500">Dr. Ádam Orosz</p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=300&h=200&fit=crop"
                  alt="Convierte tu terminal en un agente de codificación de IA con OpenAI o Claude CU"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors text-sm leading-tight">
                  Convierte tu terminal en un agente de codificación de IA con OpenAI o Claude CU
                </h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Codificación</span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Educador</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Alumno</span>
                </div>
                <p className="text-xs text-gray-500">Dr. Ádam Orosz</p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop"
                  alt="Prepárese para reuniones al instante con el asistente de inteligencia artificial de Claude"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors text-sm leading-tight">
                  Prepárese para reuniones al instante con el asistente de inteligencia artificial de Claude
                </h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Gestión de proyectos</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Análisis de datos</span>
                </div>
                <p className="text-xs text-gray-500">Dr. Ádam Orosz</p>
              </div>
            </div>
            
            {/* Second Row */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=300&h=200&fit=crop"
                  alt="Automatice su alcance de ventas con correos electrónicos personalizados"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors text-sm leading-tight">
                  Automatice su alcance de ventas con correos electrónicos personalizados
                </h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Ventas</span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Marketing</span>
                </div>
                <p className="text-xs text-gray-500">Dr. Ádam Orosz</p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=300&h=200&fit=crop"
                  alt="Investigue de forma más inteligente con la función de documentos web de NotebookLM"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors text-sm leading-tight">
                  Investigue de forma más inteligente con la función de documentos web de NotebookLM
                </h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Educador</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Alumno</span>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Análisis de datos</span>
                </div>
                <p className="text-xs text-gray-500">Dr. Ádam Orosz</p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=200&fit=crop"
                  alt="Crea aplicaciones web completas sin codificar con Firebase Studio"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors text-sm leading-tight">
                  Crea aplicaciones web completas sin codificar con Firebase Studio
                </h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Diseño</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Codificación</span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Educador</span>
                </div>
                <p className="text-xs text-gray-500">Dr. Ádam Orosz</p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=200&fit=crop"
                  alt="Transforme sus hojas de cálculo con fórmulas de IA en hojas de cálculo de Google"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors text-sm leading-tight">
                  Transforme sus hojas de cálculo con fórmulas de IA en hojas de cálculo de Google
                </h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Análisis de datos</span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Creador de contenido</span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Codificación</span>
                </div>
                <p className="text-xs text-gray-500">Dr. Ádam Orosz</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-full">
              Ver todas las guías →
            </Button>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="herramientas" className="py-16 px-4 bg-white text-black">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-black">Herramientas de tendencia</h2>
            <p className="text-gray-600 text-lg">Las herramientas de IA más útiles, organizadas y categorizadas en un solo lugar.</p>
          </div>
          
          {/* Filter Tags - Multiple Rows */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <div className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              ⭐ Más populares
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              🏷️ Todo
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              🤖 Agentes
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              💻 Codificación
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              📈 Marketing
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              ✏️ Creador de contenido
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              🎓 Educadores
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              🏢 Operaciones comerciales
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              💰 Ventas
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              💳 Finanzas
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              🎨 Diseño
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              🏥 Cuidado de la salud
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              💼 Consultante
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              🏛️ Gobierno
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              📊 Análisis de datos
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              📁 Gestión de proyectos
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              ⚖️ Legal
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              👥 Reclutamiento / RRHH
            </div>
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
              🎓 Estudiantes
            </div>
          </div>
          
          {/* Tools Grid - 4x2 Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=300&h=200&fit=crop"
                  alt="IA de Canva"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors">
                  IA de Canva
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Canva Ai potencia el flujo de trabajo de diseño gráfico con herramientas mágicas para automatizar texto, imágenes y diseños.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1676299081847-824916de030a?w=300&h=200&fit=crop"
                  alt="ChatGPT"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors">
                  ChatGPT
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  ChatGPT es su asistente de inteligencia artificial multiproposito para escribir, investigar, codificar, y ser productivo.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop"
                  alt="Claude"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors">
                  Claude
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Claude es un asistente de inteligencia artificial de antropic enfocado en interacciones seguras, útiles y honestas para tareas de escritura y razonamiento.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=300&h=200&fit=crop"
                  alt="Codeium Windsurf"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors">
                  Codeium Windsurf
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Codeium Windsurf ofrece experiencias de código, finastracciones y herramientas de depuración impulsadas por inteligencia artificial para desarrolladores.
                </p>
              </div>
            </div>
            
            {/* Second Row */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=300&h=200&fit=crop"
                  alt="OnceLabs"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors">
                  OnceLabs
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Utiliza voces realistas para dar vida al contenido.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1618004912476-29818d81ae2e?w=300&h=200&fit=crop"
                  alt="Freepik"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors">
                  Freepik
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Generación de arte con IA para una expresión creativa sin esfuerzo.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=300&h=200&fit=crop"
                  alt="Gama"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors">
                  Gama
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Gamma: crea presentaciones y documentos hermosos e interactivos utilizando inteligencia artificial generativa, sin necesidad de conocimientos de diseño.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&h=200&fit=crop"
                  alt="Géminis"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 text-black group-hover:text-blue-600 transition-colors">
                  Géminis
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Geminis es el modelo de inteligencia artificial avanzado de Google para búsqueda, productividad, codificación y tareas creativas.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button className="bg-white hover:bg-gray-50 text-black border border-gray-300 px-6 py-2 rounded-full">
              Ver todas las herramientas →
            </Button>
          </div>
        </div>
      </section>

      {/* Workshops Section */}
      <section className="py-16 px-4 bg-white text-black">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-black">
              Aprenda directamente de expertos en IA con <br />
              <span className="bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent">talleres dirigidos por expertos</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Únase a sesiones interactivas semanales en vivo con líderes de la industria que están a la vanguardia de la innovación en IA para obtener orientación práctica sobre la implementación y conocimientos exclusivos.
            </p>
          </div>
          
          {/* Company Logos */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-12 opacity-60">
            <div className="text-gray-600 text-xl font-bold">Meta</div>
            <div className="text-gray-600 text-xl font-bold">Kling AI</div>
            <div className="text-gray-600 text-xl font-bold">windsurf</div>
            <div className="text-gray-600 text-xl font-bold">bolt</div>
            <div className="text-gray-600 text-xl font-bold">Lindy</div>
            <div className="text-gray-600 text-xl font-bold">Poe</div>
          </div>
          
          {/* Workshops Grid */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            {/* Workshop 1 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex">
                <div className="flex-1">
                  <div className="aspect-video bg-gray-900 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop"
                      alt="Creación y monetización de aplicaciones móviles con Windsurf AI"
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
                  <div className="text-sm text-gray-500 mb-2">4 de febrero de 2025 • 9:00 p.m. hora del este</div>
                  <h3 className="text-xl font-bold mb-3 text-black">
                    Creación y monetización de aplicaciones móviles con Windsurf AI
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Más allá de lo básico, esta sesión avanzada le enseñará cómo construir aplicaciones móviles robustas usando Windsurf AI. Desde conceptos fundamentales hasta implementación práctica de servicios backend de machine learning en tiempo real.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>📺 Transmisión en vivo</span>
                    <span>👥 Más de 100 asistentes</span>
                  </div>
                  <Button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded text-sm">
                    Más información →
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Workshop 2 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex">
                <div className="flex-1">
                  <div className="aspect-video bg-gray-900 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop"
                      alt="Creación de agentes de IA con Lindy AI"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-white text-center p-4">
                        <div className="text-sm font-medium mb-2 text-blue-400">Agent</div>
                        <h3 className="text-lg font-bold mb-2">Create AI agents to respond to emails on your behalf</h3>
                        <div className="text-sm opacity-80">LIVE STREAMED • 100+ ATTENDEES</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-6">
                  <div className="text-sm text-gray-500 mb-2">31 de enero de 2025 • 9:00 p.m. hora del este</div>
                  <h3 className="text-xl font-bold mb-3 text-black">
                    Creación de agentes de IA con Lindy AI
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Aprenda a crear agentes de IA inteligentes y autónomos que pueden manejar interacciones, lo que le permite concentrarse en tareas específicas del negocio que han integrado asistentes virtuales que ahora pueden comunicarse.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>📺 Transmisión en vivo</span>
                    <span>👥 Más de 100 asistentes</span>
                  </div>
                  <Button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded text-sm">
                    Más información →
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Workshop 3 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex">
                <div className="flex-1">
                  <div className="aspect-video bg-gray-900 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1676299081847-824916de030a?w=400&h=300&fit=crop"
                      alt="Cómo automatizar tareas con el operador ChatGPT"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-white text-center p-4">
                        <div className="text-sm font-medium mb-2 text-blue-400">Automatization</div>
                        <h3 className="text-lg font-bold mb-2">Automate tasks with ChatGPT Operator</h3>
                        <div className="text-sm opacity-80">LIVE STREAMED • 100+ ATTENDEES</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-6">
                  <div className="text-sm text-gray-500 mb-2">28 de enero de 2025 • 9:00 p.m. hora del este</div>
                  <h3 className="text-xl font-bold mb-3 text-black">
                    Cómo automatizar tareas con el operador ChatGPT
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Aprenda a aprovechar el nuevo Operador de Chat-GPT de ChatGPT para tareas prácticas del mundo real como enviar formularios, aplicar a trabajos y hacer pedidos. Esta sesión demostrará de primer mano cómo automatizar y cumplir tareas usando estas nuevas capacidades.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>📺 Transmisión en vivo</span>
                    <span>👥 Más de 100 asistentes</span>
                  </div>
                  <Button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded text-sm">
                    Más información →
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Workshop 4 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex">
                <div className="flex-1">
                  <div className="aspect-video bg-gray-900 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=300&fit=crop"
                      alt="Utilice videos personalizados para ampliar su alcance con Synthesia"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-white text-center p-4">
                        <div className="text-sm font-medium mb-2 text-blue-400">Scale Outreach</div>
                        <h3 className="text-lg font-bold mb-2">Scale outreach with personalized AI avatar videos</h3>
                        <div className="text-sm opacity-80">LIVE STREAMED • 100+ ATTENDEES</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-6">
                  <div className="text-sm text-gray-500 mb-2">25 de enero de 2025 • 9:00 p.m. hora del este</div>
                  <h3 className="text-xl font-bold mb-3 text-black">
                    Utilice videos personalizados para ampliar su alcance con Synthesia
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Aprenda a crear videos de divulgación personalizada e interactiva de alta producción con la IA avatar de Synthesia a escala de cientos desde una plantilla base que se individualiza por cada prospecte y propósito específico de marca.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>📺 Transmisión en vivo</span>
                    <span>👥 Más de 100 asistentes</span>
                  </div>
                  <Button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded text-sm">
                    Más información →
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Note */}
          <div className="text-center text-gray-600 text-sm mb-8 max-w-4xl mx-auto">
            Todos los talleres incluyen interacciones, sesiones de preguntas y respuestas y una demostración. Las grabaciones previas se almacenan en la Universidad.
          </div>
          
          <div className="text-center">
            <Button className="bg-white hover:bg-gray-50 text-black border border-gray-300 px-6 py-2 rounded-full">
              Ver todos los talleres →
            </Button>
          </div>
        </div>
      </section>

      {/* University CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto max-w-6xl text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <span className="text-white text-xl font-bold">
              The Rundown <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">University</span>
            </span>
          </div>

          <h2 className="text-4xl font-bold mb-4 text-white">
            Capacitación en IA para el futuro del trabajo.
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-3xl mx-auto">
            Obtenga acceso a todos nuestros cursos de certificación en IA, cientos de casos de uso de IA en el mundo real, talleres dirigidos por expertos en vivo, una red exclusiva de primeros usuarios de IA y más.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/universidad-nocode-ia">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg px-8 py-3 rounded-full">
                Únete a la Universidad de IA
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 text-lg px-8 py-3 rounded-full">
              Más información
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Cursos de IA */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Cursos de IA</h3>
              <p className="text-gray-400 text-sm">
                Obtén acceso ilimitado a todos nuestros cursos de IA, actuales y futuros, específicos de cada sector durante tu suscripción. Cada curso incluye una certificación.
              </p>
            </div>

            {/* Guías diarias */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Guías diarias</h3>
              <p className="text-gray-400 text-sm">
                Para seguir el ritmo de la IA, nuestro equipo publica a diario guías de implementación. Nuestra biblioteca contiene más de 500 casos prácticos para automatizar el trabajo en el mundo real.
              </p>
            </div>

            {/* Talleres */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Talleres</h3>
              <p className="text-gray-400 text-sm">
                Únase a sesiones interactivas semanales en vivo con líderes de la industria que están a la vanguardia de la IA para obtener orientación práctica sobre implementación y conocimientos exclusivos.
              </p>
            </div>

            {/* Comunidad */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Comunidad</h3>
              <p className="text-gray-400 text-sm">
                Conéctate con una comunidad exclusiva de profesionales que priorizan la IA y trabajan con ella de forma más inteligente. Descubre con los pioneros que están liderando en trabajo y en negocios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-gray-100 text-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">R</span>
                </div>
                <span className="text-lg font-bold text-black">The Rundown</span>
              </div>
              <p className="text-gray-600 text-sm mb-6 max-w-md">
                Entérese de las últimas noticias de IA, comprenda cómo implementarla y aprenda a aplicarla en su trabajo. Leído por más de 6,000,000 lectores de empresas como Apple, OpenAI y la NASA.
              </p>
              
              {/* Email Subscription */}
              <div className="flex gap-2 max-w-md">
                <input
                  type="email"
                  placeholder="Dirección de correo electrónico"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <Button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded text-sm">
                  Suscribir
                </Button>
              </div>
            </div>

            {/* Manténgase actualizado */}
            <div>
              <h4 className="font-semibold mb-4 text-black">Manténgase actualizado</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-black transition-colors">Artículos</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Podcast</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Guías</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Herramientas</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Talleres</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Bolsa de trabajo de IA</Link></li>
              </ul>
            </div>

            {/* Universidad de IA */}
            <div>
              <h4 className="font-semibold mb-4 text-black">Universidad de IA</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="/universidad-nocode-ia" className="hover:text-black transition-colors">IA para empresas</Link></li>
                <li><Link href="/universidad-nocode-ia" className="hover:text-black transition-colors">IA para codificación</Link></li>
                <li><Link href="/universidad-nocode-ia" className="hover:text-black transition-colors">IA para la creación de contenido</Link></li>
                <li><Link href="/universidad-nocode-ia" className="hover:text-black transition-colors">IA para la educación</Link></li>
                <li><Link href="/universidad-nocode-ia" className="hover:text-black transition-colors">IA para marketing</Link></li>
                <li><Link href="/universidad-nocode-ia" className="hover:text-black transition-colors">Todos los cursos de certificación</Link></li>
              </ul>
            </div>

            {/* Compañía */}
            <div>
              <h4 className="font-semibold mb-4 text-black">Compañía</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-black transition-colors">Anunciar</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Carreras</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Contáctenos</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">política de privacidad</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Términos y condiciones</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">© 2025 The Rundown AI. Co. Todos los derechos reservados.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-black transition-colors">
                <span className="sr-only">X</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-black transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C3.967 14.559 3.29 13.145 3.29 11.435c0-1.711.678-3.124 1.836-4.257.875-.808 2.026-1.297 3.323-1.297 1.297 0 2.448.49 3.323 1.297C13.031 8.311 13.708 9.724 13.708 11.435c0 1.71-.677 3.124-1.836 4.256-.875.807-2.026 1.297-3.323 1.297z" clipRule="evenodd"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-black transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" clipRule="evenodd"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}