import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  Gift, 
  Zap, 
  Crown, 
  Users, 
  Book, 
  Video, 
  MessageSquare,
  Download,
  ExternalLink,
  Check
} from "lucide-react";

export default function Perks() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized", 
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex">
        <div className="w-[250px] bg-dark-card border-r border-dark-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  const membershipTiers = [
    {
      id: "free",
      name: "Estudiante",
      price: "Gratis",
      description: "Acceso básico a contenido seleccionado",
      features: [
        "Acceso a cursos básicos",
        "Comunidad Discord",
        "Recursos descargables limitados",
        "Soporte por chat"
      ],
      current: true
    },
    {
      id: "pro",
      name: "Pro",
      price: "$29/mes",
      description: "Acceso completo a toda la plataforma",
      features: [
        "Acceso a todos los cursos",
        "Sesiones en vivo exclusivas",
        "Recursos descargables ilimitados",
        "Mentorías 1-on-1 mensuales",
        "Certificaciones oficiales",
        "Acceso temprano a nuevo contenido"
      ],
      current: false,
      popular: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$99/mes",
      description: "Para equipos y empresas",
      features: [
        "Todo lo de Pro",
        "Dashboard de equipo",
        "Reportes de progreso",
        "Sesiones privadas de equipo",
        "Integración con herramientas empresariales",
        "Soporte prioritario 24/7"
      ],
      current: false
    }
  ];

  const exclusivePerks = [
    {
      icon: Video,
      title: "Sesiones Exclusivas",
      description: "Acceso a masterclasses y workshops solo para miembros Pro",
      available: ["pro", "enterprise"]
    },
    {
      icon: Users,
      title: "Mentorías 1-on-1",
      description: "Sesiones personalizadas con expertos de la industria",
      available: ["pro", "enterprise"]
    },
    {
      icon: Crown,
      title: "Acceso Temprano",
      description: "Sé el primero en acceder a nuevos cursos y contenido",
      available: ["pro", "enterprise"]
    },
    {
      icon: Download,
      title: "Recursos Premium",
      description: "Plantillas, herramientas y recursos exclusivos",
      available: ["pro", "enterprise"]
    },
    {
      icon: MessageSquare,
      title: "Canal VIP Discord",
      description: "Acceso a canales privados con networking premium",
      available: ["pro", "enterprise"]
    },
    {
      icon: Book,
      title: "Certificaciones",
      description: "Certificados oficiales verificables de la industria",
      available: ["pro", "enterprise"]
    }
  ];

  const partnerBenefits = [
    {
      partner: "Make.com",
      benefit: "50% descuento en suscripción anual",
      description: "Automatiza procesos con la plataforma No-Code líder",
      logo: "🔄"
    },
    {
      partner: "FlutterFlow",
      benefit: "3 meses gratis en plan Pro",
      description: "Crea aplicaciones móviles sin código",
      logo: "📱"
    },
    {
      partner: "Bubble.io",
      benefit: "Descuento del 30% en primer año",
      description: "Desarrolla aplicaciones web completas",
      logo: "🫧"
    },
    {
      partner: "Zapier",
      benefit: "Plan Starter gratuito por 6 meses",
      description: "Conecta todas tus aplicaciones",
      logo: "⚡"
    }
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 md:ml-16 lg:ml-[250px]">
          {/* Header */}
          <header className="bg-dark-card border-b border-dark-border p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Beneficios y Perks</h1>
                <p className="text-gray-400 mt-1">
                  Desbloquea beneficios exclusivos y acelera tu aprendizaje.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Miembro desde Enero 2025</span>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-6 py-8 max-w-7xl">
            {/* Membership Tiers */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-6">Planes de Membresía</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {membershipTiers.map((tier) => (
                  <Card key={tier.id} className={`bg-dark-card border-dark-border relative ${tier.popular ? 'ring-2 ring-purple-500' : ''}`}>
                    {tier.popular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white">
                        Más Popular
                      </Badge>
                    )}
                    {tier.current && (
                      <Badge className="absolute -top-3 right-4 bg-green-600 text-white">
                        Actual
                      </Badge>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-white text-xl">{tier.name}</CardTitle>
                      <div className="text-3xl font-bold text-purple-400 my-2">{tier.price}</div>
                      <CardDescription className="text-gray-400">{tier.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <span className="text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {!tier.current && (
                        <Button className={`w-full ${tier.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-dark-bg hover:bg-dark-bg/80'} border-dark-border`}>
                          {tier.id === 'enterprise' ? 'Contactar Ventas' : 'Actualizar Plan'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Exclusive Perks */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-6">Beneficios Exclusivos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exclusivePerks.map((perk, index) => (
                  <Card key={index} className="bg-dark-card border-dark-border">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-purple-600/20">
                          <perk.icon className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{perk.title}</h3>
                          <div className="flex gap-1 mt-1">
                            {perk.available.includes('pro') && (
                              <Badge className="text-xs bg-purple-500/20 text-purple-400">Pro</Badge>
                            )}
                            {perk.available.includes('enterprise') && (
                              <Badge className="text-xs bg-blue-500/20 text-blue-400">Enterprise</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm">{perk.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Partner Benefits */}
            <section>
              <h2 className="text-xl font-bold text-white mb-6">Beneficios de Partners</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {partnerBenefits.map((partner, index) => (
                  <Card key={index} className="bg-dark-card border-dark-border">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{partner.logo}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg">{partner.partner}</h3>
                          <p className="text-purple-400 font-medium mt-1">{partner.benefit}</p>
                          <p className="text-gray-400 text-sm mt-2">{partner.description}</p>
                          <Button variant="outline" className="mt-4 border-dark-border text-gray-300 hover:bg-dark-bg">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Obtener Beneficio
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}