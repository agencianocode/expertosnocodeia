import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";

export default function Planes() {
  const [activeTab, setActiveTab] = useState<'individual' | 'equipos'>('individual');

  const individualPlans = [
    {
      id: 'prueba-gratis',
      title: 'Prueba Gratis',
      currentPrice: 0,
      period: '/14 días',
      subtitle: 'Desbloquear el acceso a:',
      features: [
        '5-10 casos de uso de IA',
        'Cursos de IA certificados para la industria seleccionada',
        'Guías diarias paso a paso',
        'Talleres semanales dirigidos por expertos (solo en vivo)',
        'Comunidad privada'
      ],
      buttonText: 'Empezar ahora',
      buttonVariant: 'secondary' as const,
      highlight: false
    },
    {
      id: 'mensual',
      title: 'Mensual',
      currentPrice: 39,
      period: '/mes',
      subtitle: 'Perfecto para empezar',
      features: [
        'Acceso completo a la universidad',
        '300+ guías paso a paso',
        'Workshops en vivo semanales',
        'Comunidad privada',
        'Certificados de finalización',
        'Descuentos en herramientas'
      ],
      buttonText: 'Empezar ahora',
      buttonVariant: 'secondary' as const,
      highlight: false
    },
    {
      id: 'anual',
      title: 'Anual',
      currentPrice: 299,
      period: '/año',
      subtitle: 'Mejor valor - Ahorra $169',
      badge: 'Más Popular',
      badgeType: 'primary',
      features: [
        'Todo lo incluido en Mensual',
        '2 meses GRATIS',
        'Acceso prioritario a workshops',
        'Sesiones 1:1 mensuales',
        'Recursos exclusivos',
        'Garantía de 30 días'
      ],
      buttonText: 'Empezar ahora',
      buttonVariant: 'primary' as const,
      highlight: true
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-[250px] min-h-screen bg-background">
          <div className="max-w-4xl mx-auto py-12 px-4 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-8">
                Elija un plan de suscripción
              </h1>
              
              {/* Tabs */}
              <div className="inline-flex rounded-lg bg-muted p-1 mb-8">
                <button
                  onClick={() => setActiveTab('individual')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'individual'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Individual
                </button>
                <button
                  onClick={() => setActiveTab('equipos')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'equipos'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Equipos
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            {activeTab === 'individual' && (
              <div className="grid md:grid-cols-3 gap-32 max-w-[1600px] mx-auto px-8">
                {individualPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl p-10 flex flex-col h-full min-w-[320px] ${
                      plan.highlight 
                        ? 'bg-card border-2 border-primary' 
                        : 'bg-card border border-border'
                    }`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge 
                          className={`${
                            plan.badgeType === 'primary' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-secondary text-secondary-foreground'
                          } px-4 py-1`}
                        >
                          ⭐ {plan.badge}
                        </Badge>
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className="mb-8 text-center">
                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        {plan.title}
                      </h3>
                      
                      {/* Pricing */}
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-foreground">
                          ${plan.currentPrice}
                        </span>
                        <span className="text-muted-foreground">
                          {plan.period}
                        </span>
                      </div>
                      
                      {plan.subtitle && (
                        <p className="text-muted-foreground text-sm">
                          {plan.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8 flex-grow">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <div className="mt-auto">
                      <Button
                        className={`w-full py-3 font-medium ${
                          plan.buttonVariant === 'primary'
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                        onClick={() => {
                          // TODO: Implement subscription logic
                          console.log(`Selected plan: ${plan.id}`);
                        }}
                      >
                        {plan.buttonText}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Equipos Tab Content */}
            {activeTab === 'equipos' && (
              <div className="text-center py-16">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Planes para Equipos
                </h3>
                <p className="text-muted-foreground mb-8">
                  ¿Necesitas un plan para tu equipo? Contacta con nosotros para obtener precios personalizados.
                </p>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Contactar Ventas
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}