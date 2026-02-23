import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useQuery } from "@tanstack/react-query";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { Check, ArrowLeft, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Inicializar Stripe (usa tu publishable key)
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_..."
);

function TrialPaymentForm({
  email,
  planId,
  onSuccess,
  onError,
  loading,
  setLoading,
}: {
  email: string;
  planId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      onError("Introduce un email válido");
      return;
    }
    setLoading(true);
    onError("");
    try {
      sessionStorage.setItem("trialPending", JSON.stringify({ planId, email: trimmedEmail }));
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          payment_method_data: { billing_details: { email: trimmedEmail } },
          return_url: `${window.location.origin}/checkout-return?trial=1`,
        },
      });
      if (result.error) {
        sessionStorage.removeItem("trialPending");
        onError(result.error.message || "Error al guardar el método de pago");
        setLoading(false);
        return;
      }
      const si = (result as { setupIntent?: { payment_method?: string | { id: string } } }).setupIntent;
      const pm = si?.payment_method;
      const paymentMethodId = typeof pm === "string" ? pm : pm?.id;
      if (paymentMethodId) {
        const res = await fetch("/api/subscriptions/create-trial-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethodId,
            planId,
            email: trimmedEmail,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || data.message || "Error al activar la prueba");
      }
      sessionStorage.removeItem("trialPending");
      onSuccess();
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      <Button type="submit" className="w-full" disabled={!stripe || loading}>
        {loading ? "Procesando…" : "Suscribir"}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const [, params] = useRoute("/checkout/:planId");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useSimpleAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guestClientSecret, setGuestClientSecret] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [guestEmail, setGuestEmail] = useState("");
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const planId = params?.planId;

  // Fetch plan details
  const { data: plans } = useQuery<any[]>({
    queryKey: ["/api/subscription/plans"],
  });

  // Resolver planId "trial" al plan de prueba real (14 días, etc.)
  const effectivePlanId =
    planId === "trial"
      ? plans?.find(
          (p: any) =>
            (p.trialDays && p.trialDays > 0) ||
            p.billingInterval === "trial" ||
            (p.price !== undefined && Number(p.price) === 0)
        )?.id ?? null
      : planId;

  const plan = plans?.find((p: any) => p.id === effectivePlanId);
  const isGuestTrial = !isAuthenticated && planId === "trial" && !!effectivePlanId;
  const isTrialWaitingPlans = !isAuthenticated && planId === "trial" && plans === undefined;

  // Redirigir a login solo si no es flujo guest de prueba (no redirigir mientras cargan planes en /checkout/trial)
  useEffect(() => {
    if (isTrialWaitingPlans) return;
    if (!isAuthenticated && planId !== "trial") {
      setLocation("/login");
      return;
    }
    if (!isAuthenticated && planId === "trial" && plans && !effectivePlanId) {
      setLocation("/planes");
      return;
    }
  }, [isAuthenticated, planId, plans, effectivePlanId, isTrialWaitingPlans, setLocation]);

  // Create checkout session (usuario logueado)
  useEffect(() => {
    if (!effectivePlanId || !isAuthenticated || clientSecret) return;

    const createCheckoutSession = async () => {
      try {
        const token = localStorage.getItem("simpleAuthToken");
        const response = await fetch("/api/subscriptions/checkout-embedded", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ planId: effectivePlanId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || "Error al crear sesión");
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message);
        console.error("Error creating checkout session:", err);
      }
    };

    createCheckoutSession();
  }, [effectivePlanId, isAuthenticated, clientSecret]);

  // Trial invitado: obtener SetupIntent al cargar para mostrar email + tarjeta en una sola pantalla
  useEffect(() => {
    if (!isGuestTrial || !effectivePlanId || setupClientSecret) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/subscriptions/trial-setup-intent-guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: effectivePlanId }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || data.message || "Error al cargar");
        setSetupClientSecret(data.clientSecret);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [isGuestTrial, effectivePlanId, setupClientSecret]);

  // Clases para fondo blanco fijo en toda la página de checkout
  const pageBg = "min-h-screen bg-white text-gray-900";
  const mutedText = "text-gray-600";

  // Trial invitado: una sola pantalla como imagen 1 (dos columnas: beneficios + email/tarjeta/Suscribir)
  if (isGuestTrial && plan) {
    const isTrialPlan = (plan.trialDays && plan.trialDays > 0) || plan.billingInterval === "trial";
    const totalToday = isTrialPlan ? 0 : (plan.price / 100);
    const monthlyDollars = plan.billingInterval === "year" ? Math.round(plan.price / 100 / 12) : (plan.price / 100) || 39;

    return (
      <div className={pageBg}>
        <div className="container mx-auto px-6 sm:px-4 pt-12 pb-4 sm:pt-16 sm:pb-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            {/* Columna izquierda: logo + beneficios */}
            <div className="space-y-4">
              <img
                src="/Logo.svg"
                alt="Expertos NoCode IA"
                className="h-12 w-auto sm:h-16 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Prueba Gratuita De 14 Días
              </h1>
              <div className="flex items-center justify-between">
                <span className={mutedText}>Total a pagar hoy</span>
                <span className={`text-2xl font-bold ${totalToday === 0 ? "text-green-600" : "text-gray-900"}`}>
                  ${totalToday}
                </span>
              </div>
              <Collapsible defaultOpen={true}>
                <CollapsibleTrigger className={`flex items-center gap-2 text-sm ${mutedText} hover:text-gray-900 w-full text-left`}>
                  <ChevronDown className="h-4 w-4" /> Ver detalles
                </CollapsibleTrigger>
                <CollapsibleContent className={`pt-2 space-y-1 text-sm ${mutedText}`}>
                  <div>Valor mensual: ${monthlyDollars} USD</div>
                  <div>Total a pagar después de 14 días de prueba: ${monthlyDollars} USD</div>
                </CollapsibleContent>
              </Collapsible>
              <div className="rounded-lg p-4 sm:p-5 bg-sky-50 border border-sky-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Su prueba de 14 días le brinda acceso completo a:
                </h3>
                <ul className="space-y-2">
                  {["5-10 recursos de IA que puedes implementar en minutos", "Guías diarias paso a paso para las últimas herramientas y flujos de trabajo de IA", "Talleres semanales en vivo dirigidos por expertos", "Cursos de certificación específicos de la industria para demostrar sus habilidades", "Comunidad exclusiva de profesionales que aprenden y aplican IA"].map((text, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-800">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg p-4 bg-sky-50/80 border border-sky-200 flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${mutedText}`}>
                  Invierte en tu crecimiento profesional. La formación en IA es una de las mejores decisiones para tu carrera.
                </p>
              </div>
            </div>

            {/* Columna derecha: Método de pago alineado con el logo */}
            <div className="space-y-4 lg:pt-0">
              <Card className="bg-gray-100 border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                    Método de pago
                  </h2>
                  {!setupClientSecret ? (
                    <div className="flex items-center justify-center py-8">
                      <p className={mutedText}>Cargando…</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        <Label htmlFor="guest-email" className="text-gray-900">Correo electrónico</Label>
                        <Input
                          id="guest-email"
                          type="email"
                          placeholder="tu@correoelectrónico.com"
                          value={guestEmail}
                          onChange={(e) => { setGuestEmail(e.target.value); setError(null); }}
                          className="bg-white border-gray-300"
                        />
                      </div>
                      {error && <p className="text-sm text-destructive mb-2">{error}</p>}
                      <Elements stripe={stripePromise} options={{ clientSecret: setupClientSecret, appearance: { theme: "stripe", variables: { borderRadius: "8px" } } }}>
                        <TrialPaymentForm
                          email={guestEmail}
                          planId={effectivePlanId!}
                          onSuccess={() => setLocation("/checkout-return?trial=1")}
                          onError={setError}
                          loading={loadingSubmit}
                          setLoading={setLoadingSubmit}
                        />
                      </Elements>
                    </>
                  )}
                </CardContent>
              </Card>
              <p className="text-xs text-gray-500">
                Se factura mensualmente o al finalizar el periodo de prueba. Todos los precios están en USD. Cancela antes del periodo de prueba sin coste. Al suscribirte, aceptas nuestros{" "}
                <Link href="/condiciones-servicio" className="underline">términos</Link> y{" "}
                <Link href="/politica-privacidad" className="underline">política de privacidad</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invitado trial esperando plan
  if (isGuestTrial) {
    return (
      <div className={`${pageBg} flex items-center justify-center`}>
        <p className={mutedText}>Cargando…</p>
      </div>
    );
  }

  if (!isAuthenticated && !isGuestTrial) {
    if (planId === "trial" && plans === undefined) {
      return (
        <div className={`${pageBg} flex items-center justify-center`}>
          <p className={mutedText}>Cargando...</p>
        </div>
      );
    }
    return (
      <div className={`${pageBg} flex items-center justify-center`}>
        <p className={mutedText}>Redirigiendo...</p>
      </div>
    );
  }

  const activeClientSecret = isGuestTrial ? guestClientSecret : clientSecret;

  if (error) {
    return (
      <div className={`${pageBg} flex items-center justify-center p-4`}>
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Error al cargar checkout
            </h2>
            <p className={`${mutedText} mb-4`}>{error}</p>
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
    if (planId === "trial" && plans && !effectivePlanId) {
      return (
        <div className={`${pageBg} flex items-center justify-center p-4`}>
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Plan de prueba no disponible
              </h2>
              <p className={`${mutedText} mb-4`}>
                No encontramos un plan con prueba gratuita. Revisa las opciones en Planes.
              </p>
              <Button onClick={() => setLocation("/planes")} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ver planes
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className={`${pageBg} flex items-center justify-center`}>
        <p className={mutedText}>Cargando plan...</p>
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

  const isTrialPlan = (plan.trialDays && plan.trialDays > 0) || plan.billingInterval === "trial";
  const totalToday = isTrialPlan ? 0 : priceInDollars;
  const monthlyDollars = plan.billingInterval === "year" ? Math.round(priceInDollars / 12) : (priceInDollars || 39);

  const planDisplayName =
    plan.billingInterval === "month"
      ? "Mensual"
      : plan.billingInterval === "year"
      ? "Anual"
      : plan.displayName;
  const trialTitle = isTrialPlan ? "Prueba Gratuita De 14 Días" : planDisplayName;

  return (
    <div className={pageBg}>
      <div className="container mx-auto px-6 sm:px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <img
            src="/Logo.svg"
            alt="Expertos NoCode IA"
            className="h-14 w-auto sm:h-16 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Resumen estilo The Rundown (fondo blanco) */}
          <div className="space-y-5">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {trialTitle}
            </h1>

            {/* Total a pagar hoy - $0 en verde cuando es trial */}
            <div className="flex items-center justify-between">
              <span className={mutedText}>Total a pagar hoy</span>
              <span className={`text-2xl font-bold ${totalToday === 0 ? "text-green-600" : "text-gray-900"}`}>
                ${totalToday}
              </span>
            </div>

            {/* Ver detalles (collapsible) */}
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger className={`flex items-center gap-2 text-sm ${mutedText} hover:text-gray-900 w-full text-left`}>
                {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Ver detalles
              </CollapsibleTrigger>
              <CollapsibleContent className={`pt-2 space-y-1 text-sm ${mutedText}`}>
                <div>Valor mensual: ${monthlyDollars} USD</div>
                {isTrialPlan && (
                  <div>Total a pagar después de 14 días de prueba: ${monthlyDollars} USD</div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Caja azul clara: beneficios (sobre fondo blanco) */}
            <div className="rounded-lg p-5 bg-sky-50 border border-sky-200">
              <h3 className="font-semibold text-gray-900 mb-3">
                {isTrialPlan
                  ? "Su prueba de 14 días le brinda acceso completo a:"
                  : "Tendrás acceso completo a:"}
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-800">5-10 recursos de IA que puedes implementar en minutos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-800">Guías diarias paso a paso para las últimas herramientas y flujos de trabajo de IA</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-800">Talleres semanales en vivo dirigidos por expertos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-800">Cursos de certificación específicos de la industria para demostrar sus habilidades</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-800">Comunidad exclusiva de profesionales que aprenden y aplican IA</span>
                </li>
              </ul>
            </div>

            {/* Caja info */}
            <div className="rounded-lg p-4 bg-sky-50/80 border border-sky-200 flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className={`text-sm ${mutedText}`}>
                Invierte en tu crecimiento profesional. La formación en IA es una de las mejores decisiones para tu carrera.
              </p>
            </div>
          </div>

          {/* Right: Método de pago (fondo gris claro como imagen 2) */}
          <div className="space-y-4">
            <Card className="bg-gray-100 border-gray-200">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Método de pago
                </h2>
                {activeClientSecret ? (
                  <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret: activeClientSecret }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                      <p className={mutedText}>Preparando checkout...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer legal */}
            <p className={`text-xs ${mutedText}`}>
              Se factura mensualmente o al finalizar el periodo de prueba. Todos los precios están en USD. Cancela antes del periodo de prueba sin coste. Al suscribirte, aceptas nuestros{" "}
              <Link href="/condiciones-servicio" className="text-primary underline hover:no-underline">términos</Link>
              {" "}y nuestra{" "}
              <Link href="/politica-privacidad" className="text-primary underline hover:no-underline">política de privacidad</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

