import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { Link } from "wouter";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNav from "@/components/layout/mobile-nav";

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  billingInterval: string;
  trialDays: number;
  features: string[];
  limits: Record<string, any>;
}

export default function LandingPricing() {
  const { toast } = useToast();
  const { isAuthenticated } = useSimpleAuth();
  const [, setLocation] = useLocation();
  
  // Check for success/cancel from Stripe and trial_started after registration
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: "¡Pago exitoso!",
        description: "Tu suscripción se ha activado correctamente.",
      });
      window.history.replaceState({}, '', '/planes');
    } else if (params.get('canceled') === 'true') {
      toast({
        title: "Pago cancelado",
        description: "No se procesó ningún pago.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/planes');
    } else if (params.get('trial_started') === '1') {
      toast({
        title: "¡Bienvenido!",
        description: "Tu prueba gratuita de 14 días está activa. Explora los cursos y guías.",
      });
      window.history.replaceState({}, '', '/planes');
    }
  }, [toast]);

  // Fetch subscription plans
  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription/plans"],
    staleTime: 10 * 60 * 1000,
  });

  // Fetch current subscription info
  const { data: currentSubscription } = useQuery({
    queryKey: ["/api/subscription/info"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });


  const handlePlanSelect = (planId: string, isFreePlan: boolean = false) => {
    if (!isAuthenticated) {
      // Ir directo al checkout según la opción elegida (guest checkout)
      if (isFreePlan) {
        setLocation('/checkout/trial');
        return;
      }
      const apiPlan = plans?.find(p => {
        if (planId === 'mensual') return p.billingInterval === 'month';
        if (planId === 'anual') return p.billingInterval === 'year';
        return false;
      });
      if (apiPlan) {
        setLocation(`/checkout/${apiPlan.id}`);
      } else {
        toast({
          title: "Plan no disponible",
          description: "Los planes se están cargando. Intenta en un momento.",
          variant: "destructive",
        });
      }
      return;
    }

    if (isFreePlan) {
      toast({
        title: "Plan gratuito",
        description: "Este plan se activará automáticamente al registrarte.",
      });
      return;
    }

    // Redirigir al nuevo checkout embebido
    const apiPlan = plans?.find(p => {
      if (planId === 'mensual') return p.billingInterval === 'month';
      if (planId === 'anual') return p.billingInterval === 'year';
      return false;
    });

    if (apiPlan) {
      setLocation(`/checkout/${apiPlan.id}`);
    } else {
      toast({
        title: "Plan no disponible",
        description: "Este plan no está disponible en este momento.",
        variant: "destructive",
      });
    }
  };

  // Static plans configuration
  const staticPlans = [
    {
      id: 'prueba-gratis',
      title: 'Prueba Gratis (15 días)',
      price: 0,
      period: '/primeros 15 días (luego $39/mes)',
      subtitle: 'Explora todo el ecosistema sin compromiso.',
      features: [
        'Acceso completo a Programas Core: Agentes IA 2.0, VibeCoding y NoCode SaaS IA.',
        'Guías diarias paso a paso: Implementaciones prácticas desde el primer día.',
        'Workshops en vivo: Participa en los talleres de la semana con expertos.',
        'Comunidad Privada: Conecta con otros creadores y profesionales.',
        'Centro de Oportunidades: Explora vacantes y proyectos en NoCode Match.',
        'Sin permanencia: Cancela fácilmente antes del día 15 si no es para ti.'
      ],
      isPopular: false,
      ctaLabel: 'Empezar mi prueba gratuita',
      apiPlanId: plans?.find(p => p.billingInterval === 'trial' || p.price === 0)?.id
    },
    {
      id: 'mensual',
      title: 'Membresía Mensual',
      price: 39,
      period: '/mes',
      subtitle: 'Formación continua y herramientas de implementación.',
      features: [
        'Todo el contenido de la Prueba Gratis incluido.',
        'Cursos de IA Certificados: Obtén diplomas avalados por la industria.',
        'Biblioteca de Workshops "A pedido": Acceso a todas las grabaciones pasadas.',
        'Rutas de Aprendizaje: Guía estructurada para dominar cada tecnología.',
        'Apoyo del equipo de expertos: Resolvemos tus dudas técnicas en la plataforma.',
        'Descuentos en Herramientas: Ahorra en las suscripciones de software que usas a diario.'
      ],
      isPopular: false,
      ctaLabel: 'Unirme mensualmente',
      apiPlanId: plans?.find(p => p.billingInterval === 'month')?.id
    },
    {
      id: 'anual',
      title: 'Plan Anual — Acceso Total',
      price: 297,
      period: '/año',
      subtitle: 'Ahorras $171 USD al año (Equivale a solo $24.75/mes).',
      features: [
        'Todo lo incluido en el Plan Mensual.',
        '2 Meses de regalo: Pago único anual con descuento masivo.',
        'Apoyo Personalizado Prioritario: Respuesta preferente de nuestro equipo en tus proyectos.',
        'Acceso VIP a NoCode Match: Sé el primero en ver y aplicar a las mejores oportunidades.',
        'Recursos Exclusivos: Plantillas y prompts avanzados solo para miembros anuales.',
        'Garantía de 30 días: Si no estás satisfecho, te devolvemos el dinero sin preguntas.'
      ],
      isPopular: true,
      ctaLabel: 'Obtener Acceso Total y Ahorrar',
      apiPlanId: plans?.find(p => p.billingInterval === 'year')?.id
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className="flex">
        {/* Sin sidebar lateral: solo contenido de precios centrado */}
        <main className="flex-1 w-full min-h-screen bg-background pb-20 lg:pb-12 overflow-auto flex items-center justify-center">
          <div className="max-w-7xl mx-auto w-full px-8">
            {/* Hero Section */}
            <section className="px-4 mb-6">
              <div className="text-center">
                <Badge className="mb-3 bg-primary/20 text-primary border-primary/50 text-sm">
                  💰 Planes y Precios
                </Badge>
                <h1 className="text-3xl font-bold mb-2 text-foreground">
                  {isAuthenticated ? (
                    'Actualizar mi plan'
                  ) : (
                    <>Elige el plan perfecto <span className="text-primary">para tu crecimiento</span></>
                  )}
                </h1>
                <p className="text-base text-muted-foreground mb-6 max-w-3xl mx-auto">
                  {isAuthenticated 
                    ? 'Cambia o actualiza tu plan en cualquier momento'
                    : 'Accede a cursos completos, guías diarias, workshops en vivo y una comunidad exclusiva'
                  }
                </p>
                {!isAuthenticated && (
                  <p className="text-sm text-muted-foreground">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-primary font-medium hover:underline">
                      Iniciar sesión
                    </Link>
                  </p>
                )}
              </div>
            </section>

            {/* Plans Grid */}
            <section className="px-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {staticPlans.map((plan) => {
                // Determine if this is the current plan
                const currentPlan = (currentSubscription as any)?.plan;
                const isCurrentPlan = 
                  (plan.id === 'prueba-gratis' && currentPlan === 'FREE') ||
                  (plan.id === 'mensual' && currentPlan === 'MENSUAL') ||
                  (plan.id === 'anual' && currentPlan === 'ANUAL');

                return (
              <Card
                key={plan.id}
                className={`relative bg-card transition-all hover:shadow-lg ${
                  isCurrentPlan
                    ? 'border-2 border-green-500/50 shadow-green-500/10'
                    : plan.isPopular
                    ? 'border-2 border-primary shadow-primary/20'
                    : 'border border-border hover:border-primary/50'
                }`}
              >
                {plan.isPopular && !isCurrentPlan && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1 border-0 text-sm">
                      Más Popular
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-4 py-1 border-0 text-sm">
                      ✓ Plan Actual
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-4 px-5">
                  <CardTitle className="text-xl mb-2 text-foreground">{plan.title}</CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-tight">
                    {plan.subtitle}
                  </p>
                </CardHeader>
                <CardContent className="pt-2 pb-4 px-5">
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-sm leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => {
                      if (isCurrentPlan) {
                        return; // No hacer nada si es el plan actual
                      }
                      
                      handlePlanSelect(plan.id, plan.id === 'prueba-gratis');
                    }}
                    disabled={isCurrentPlan}
                    className={`w-full ${
                      isCurrentPlan
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : plan.isPopular
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border'
                    }`}
                    size="default"
                  >
                    {isCurrentPlan ? (
                      'Tu plan actual'
                    ) : (
                      <>
                        {(plan as any).ctaLabel || 'Empezar ahora'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
                );
              })}
              </div>
            </section>

            {/* CTA Section */}
            <section className="px-4">
              <div className="text-center">
                <h2 className="text-base font-semibold mb-3 text-foreground">
                  ¿Tienes preguntas? Estamos aquí para ayudar.
                </h2>
                <Link href="/support">
                  <Button 
                    size="default"
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted"
                  >
                    Contactar Soporte
                  </Button>
                </Link>
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

