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
      toast({
        title: "Crea tu cuenta",
        description: isFreePlan
          ? "Regístrate para comenzar tu prueba gratuita de 14 días."
          : "Regístrate para elegir tu plan y continuar al pago.",
        variant: "default",
      });
      const intent = isFreePlan ? "trial" : "subscribe";
      setLocation(`/register?intent=${intent}`);
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
      title: 'Prueba Gratis',
      price: 0,
      period: '/14 días',
      subtitle: 'Desbloquear el acceso a:',
      features: [
        '5-10 casos de uso de IA',
        'Cursos de IA certificados para la industria seleccionada',
        'Guías diarias paso a paso',
        'Talleres semanales dirigidos por expertos (solo en vivo)',
        'Comunidad privada'
      ],
      isPopular: false,
      apiPlanId: plans?.find(p => p.billingInterval === 'trial' || p.price === 0)?.id
    },
    {
      id: 'mensual',
      title: 'Mensual',
      price: 39,
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
      isPopular: false,
      apiPlanId: plans?.find(p => p.billingInterval === 'month')?.id
    },
    {
      id: 'anual',
      title: 'Anual',
      price: 299,
      period: '/año',
      subtitle: 'Mejor valor - Ahorra $169',
      features: [
        'Todo lo incluido en Mensual',
        '2 meses GRATIS',
        'Acceso prioritario a workshops',
        'Sesiones 1:1 mensuales',
        'Recursos exclusivos',
        'Garantía de 30 días'
      ],
      isPopular: true,
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
                        Empezar ahora
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

