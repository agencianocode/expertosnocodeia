import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { useToast } from "@/hooks/use-toast";
import { useSimpleAuth } from "@/hooks/use-simple-auth";

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

export default function Planes() {
  const [activeTab, setActiveTab] = useState<'individual' | 'equipos'>('individual');
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

  // Create checkout session mutation
  const checkoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      // Get auth token from localStorage
      const token = localStorage.getItem('simpleAuthToken');
      
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ planId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear sesión de checkout');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "No se pudo obtener la URL de checkout.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al procesar la suscripción.",
        variant: "destructive",
      });
    },
  });

  const handlePlanSelect = (planId: string) => {
    if (!isAuthenticated) {
      const isFreePlan = planId === 'prueba-gratis';
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

    // Free plan - handle differently (maybe activate trial directly)
    if (planId === 'prueba-gratis') {
      toast({
        title: "Plan gratuito",
        description: "Este plan se activará automáticamente al registrarte.",
      });
      return;
    }

    // Find the API plan
    const apiPlan = plans?.find(p => {
      if (planId === 'mensual') return p.billingInterval === 'month';
      if (planId === 'anual') return p.billingInterval === 'year';
      return false;
    });

    if (apiPlan) {
      checkoutMutation.mutate(apiPlan.id);
    } else {
      toast({
        title: "Procesando suscripción",
        description: "Redirigiendo al proceso de pago...",
      });
      // En caso de que no haya planes en la API, mostrar mensaje
      setTimeout(() => {
        toast({
          title: "Funcionalidad en desarrollo",
          description: "El sistema de pagos estará disponible pronto.",
          variant: "destructive",
        });
      }, 1000);
    }
  };

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
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {individualPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`relative rounded-2xl p-8 ${
                      plan.highlight 
                        ? 'bg-card border-2 border-primary shadow-lg' 
                            : 'bg-card border border-border'
                        }`}
                      >
                        {/* Badge */}
                    {plan.badge && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground px-4 py-1">
                          {plan.badge}
                            </Badge>
                          </div>
                        )}

                        {/* Plan Header */}
                        <div className="mb-8 text-center">
                      <h3 className="text-2xl font-bold text-foreground mb-2">
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
                      
                      {/* Subtitle */}
                      <p className="text-sm text-muted-foreground">
                        {plan.subtitle}
                      </p>
                        </div>

                        {/* Features */}
                    <div className="space-y-3 mb-8 min-h-[280px]">
                      {plan.features.map((feature: string, index: number) => (
                              <div key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                            <Check className="w-3 h-3 text-green-500" />
                                </div>
                          <span className="text-sm text-foreground">
                                  {feature}
                                </span>
                              </div>
                      ))}
                        </div>

                        {/* Action Button */}
                        <Button
                          className={`w-full py-3 font-medium ${
                        plan.buttonVariant === 'primary'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-card border border-border text-foreground hover:bg-muted'
                          }`}
                      onClick={() => handlePlanSelect(plan.id)}
                          disabled={checkoutMutation.isPending}
                        >
                          {checkoutMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                        plan.buttonText
                          )}
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

            {/* Support Section */}
            <div className="mt-16 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                ¿Tienes preguntas? Estamos aquí para ayudar.
              </h3>
              <Button 
                variant="outline"
                className="border-border text-foreground hover:bg-muted"
                onClick={() => setLocation('/support')}
              >
                Contactar Soporte
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}