import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Loader2, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSimpleAuth } from "@/hooks/use-simple-auth";

export default function CheckoutReturn() {
  const [, setLocation] = useLocation();
  const { user } = useSimpleAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = params.get("session_id");
    const trial = params.get("trial");
    const paid = params.get("paid");
    const setupIntent = params.get("setup_intent");
    const redirectStatus = params.get("redirect_status");

    // Flujo plan de pago invitado: suscripción ya creada en checkout, solo mostramos éxito
    if (paid === "1") {
      setStatus("success");
      window.history.replaceState({}, "", "/checkout-return");
      return;
    }

    // Flujo plan de pago invitado tras 3DS: completar suscripción con setupIntent
    if (setupIntent && redirectStatus === "succeeded") {
      const paidPending = sessionStorage.getItem("paidPending");
      if (paidPending) {
        try {
          const parsed = JSON.parse(paidPending);
          const { planId, email } = parsed;
          if (planId && email) {
            fetch("/api/subscriptions/confirm-paid-from-setup-intent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ setupIntentId: setupIntent, planId, email }),
            })
              .then((res) => res.json().catch(() => ({})))
              .then((data) => {
                sessionStorage.removeItem("paidPending");
                if (data.success !== false) {
                  setStatus("success");
                  window.history.replaceState({}, "", "/checkout-return");
                } else setStatus("error");
              })
              .catch(() => setStatus("error"));
            return;
          }
        } catch {
          setStatus("error");
          return;
        }
      }
    }

    // Flujo trial: volvemos con trial=1 o setup_intent (tras 3DS)
    if (trial === "1" || (setupIntent && redirectStatus === "succeeded")) {
      const pending = sessionStorage.getItem("trialPending");
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          const { planId, email } = parsed;
          const customerId = parsed.customerId;
          if (setupIntent && redirectStatus === "succeeded" && planId && email) {
            fetch("/api/subscriptions/confirm-trial-from-setup-intent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ setupIntentId: setupIntent, planId, email }),
            })
              .then((res) => res.json().catch(() => ({})))
              .then((data) => {
                sessionStorage.removeItem("trialPending");
                if (data.success !== false) {
                  setStatus("success");
                  window.history.replaceState({}, "", "/checkout-return");
                } else setStatus("error");
              })
              .catch(() => setStatus("error"));
          } else if (customerId && planId && email) {
            fetch("/api/subscriptions/create-trial-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ customerId, planId, email }),
            })
              .then((res) => res.json().catch(() => ({})))
              .then((data) => {
                sessionStorage.removeItem("trialPending");
                if (data.success !== false) {
                  setStatus("success");
                  window.history.replaceState({}, "", "/checkout-return");
                } else setStatus("error");
              })
              .catch(() => setStatus("error"));
          } else {
            setStatus("success");
            sessionStorage.removeItem("trialPending");
            window.history.replaceState({}, "", "/checkout-return");
          }
        } catch {
          setStatus("error");
        }
      } else {
        setStatus("success");
        window.history.replaceState({}, "", "/checkout-return");
      }
      return;
    }

    if (!sessionIdFromUrl) {
      setStatus("error");
      return;
    }

    setSessionId(sessionIdFromUrl);

    const verifySession = async () => {
      try {
        const token = localStorage.getItem("simpleAuthToken");
        const response = await fetch(
          `/api/subscriptions/verify-session?session_id=${sessionIdFromUrl}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setStatus("success");
          setTimeout(() => {
            window.history.replaceState({}, "", "/checkout-return");
          }, 1000);
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error verifying session:", error);
        setStatus("error");
      }
    };

    verifySession();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              Procesando tu pago...
            </h2>
            <p className="text-muted-foreground">
              Esto puede tardar unos segundos
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Error al procesar el pago
            </h2>
            <p className="text-muted-foreground mb-6">
              Hubo un problema al procesar tu pago. Por favor, intenta de nuevo o
              contacta a soporte.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setLocation("/planes")} variant="outline">
                Volver a planes
              </Button>
              <Button onClick={() => setLocation("/support")}>
                Contactar soporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-12">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              ¡Pago exitoso!
            </h1>
            <p className="text-lg text-muted-foreground">
              Bienvenido a Expertos NoCode IA
            </p>
          </div>

          {/* Confirmation Details */}
          <Card className="bg-muted/50 border-border mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">
                ¿Qué sigue?
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">
                    Te hemos enviado un email de confirmación a{" "}
                    <strong>{user?.email}</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">
                    Tu suscripción está activa y puedes acceder a todo el contenido
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">
                    Puedes gestionar tu suscripción desde tu perfil
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => setLocation("/")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              Ir al Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={() => setLocation("/courses")}
              variant="outline"
              size="lg"
            >
              Ver Cursos
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Si tienes alguna pregunta, no dudes en{" "}
              <button
                onClick={() => setLocation("/support")}
                className="text-primary hover:underline"
              >
                contactar a soporte
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

