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
      id: 'prueba-gratuita',
      title: 'Prueba gratuita',
      originalPrice: 999,
      currentPrice: 0,
      period: '/año',
      badge: 'Los más populares',
      badgeType: 'primary',
      trialDays: 14,
      features: [
        'Curso de certificación en IA específico de la industria',
        'Guías de IA paso a paso de 3 a 5',
        'Talleres semanales en vivo de expertos en IA',
        'Apoyo personalizado de nuestro equipo',
        'Una red de más de 10 000 usuarios pioneros de IA'
      ],
      buttonText: 'Pruébelo gratis durante 14 días',
      buttonVariant: 'primary' as const,
      highlight: true
    },
    {
      id: 'acceso-completo',
      title: 'Acceso completo',
      currentPrice: 999,
      period: '/año',
      features: [
        'Los 17 cursos de certificación en IA',
        'Más de 500 guías de IA paso a paso',
        'Talleres semanales en vivo de expertos en IA',
        'Apoyo personalizado de nuestro equipo',
        'Más de $1000 en beneficios exclusivos de herramientas de IA',
        'Una red de más de 10 000 usuarios pioneros de IA'
      ],
      buttonText: 'Suscríbete ahora',
      buttonVariant: 'secondary' as const,
      highlight: false
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
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {individualPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl p-8 ${
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
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        {plan.title}
                      </h3>
                      
                      {/* Pricing */}
                      <div className="flex items-baseline gap-3">
                        {plan.originalPrice && plan.originalPrice !== plan.currentPrice && (
                          <span className="text-2xl text-muted-foreground line-through">
                            ${plan.originalPrice}
                          </span>
                        )}
                        <span className="text-4xl font-bold text-foreground">
                          ${plan.currentPrice}
                        </span>
                        <span className="text-muted-foreground">
                          {plan.period}
                        </span>
                      </div>
                      
                      {plan.trialDays && (
                        <Badge className="mt-3 bg-blue-100 text-blue-800 border-blue-200">
                          {plan.trialDays} días gratis
                        </Badge>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
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