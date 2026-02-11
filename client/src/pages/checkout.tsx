import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useQuery } from "@tanstack/react-query";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Inicializar Stripe (usa tu publishable key)
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_..."
);

export default function Checkout() {
  const [, params] = useRoute("/checkout/:planId");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useSimpleAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const planId = params?.planId;

  // Fetch plan details
  const { data: plans } = useQuery<any[]>({
    queryKey: ["/api/subscription/plans"],
  });

  const plan = plans?.find((p: any) => p.id === planId);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  // Create checkout session
  useEffect(() => {
    if (!planId || !isAuthenticated || clientSecret) return;

    const createCheckoutSession = async () => {
      try {
        const token = localStorage.getItem("simpleAuthToken");
        const response = await fetch("/api/subscriptions/checkout-embedded", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ planId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al crear sesión");
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message);
        console.error("Error creating checkout session:", err);
      }
    };

    createCheckoutSession();
  }, [planId, isAuthenticated, clientSecret]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Error al cargar checkout
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => setLocation("/planes")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Planes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando plan...</p>
      </div>
    );
  }

  const priceInDollars = plan.price / 100;
  const period =
    plan.billingInterval === "year"
      ? "año"
      : plan.billingInterval === "month"
      ? "mes"
      : "14 días";
  
  // Nombres amigables para los planes
  const planDisplayName = 
    plan.billingInterval === "month" ? "Mensual" :
    plan.billingInterval === "year" ? "Anual" :
    plan.displayName;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/planes")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a planes
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Side: Plan Summary */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {planDisplayName}
              </h1>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-foreground">
                  ${priceInDollars}
                </span>
                <span className="text-muted-foreground">/ {period}</span>
              </div>
            </div>

            {/* Total Due Today */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Total a pagar hoy</span>
                  <span className="text-2xl font-bold text-foreground">
                    ${priceInDollars}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {plan.billingInterval === "year"
                    ? "Tarifa anual"
                    : plan.billingInterval === "month"
                    ? "Tarifa mensual"
                    : "Prueba gratuita por 14 días"}
                  : ${priceInDollars} / {period}
                </div>
              </CardContent>
            </Card>

            {/* Access Benefits */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  Tendrás acceso completo a:
                </h3>
                <ul className="space-y-3">
                  {plan.billingInterval === 'month' ? (
                    // Características del Plan Mensual
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Acceso completo a la universidad</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">300+ guías paso a paso</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Workshops en vivo semanales</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Comunidad privada</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Certificados de finalización</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Descuentos en herramientas</span>
                      </li>
                    </>
                  ) : plan.billingInterval === 'year' ? (
                    // Características del Plan Anual
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Todo lo incluido en Mensual</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">2 meses GRATIS</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Acceso prioritario a workshops</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Sesiones 1:1 mensuales</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Recursos exclusivos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Garantía de 30 días</span>
                      </li>
                    </>
                  ) : (
                    // Características por defecto
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Acceso completo a la universidad</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">300+ guías paso a paso</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Workshops en vivo semanales</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">Comunidad privada</span>
                      </li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Stripe Embedded Checkout */}
          <div>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Método de pago
                </h2>

                {clientSecret ? (
                  <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">
                        Preparando checkout...
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

