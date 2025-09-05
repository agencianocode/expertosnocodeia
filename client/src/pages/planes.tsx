import { useSubscription, useSubscriptionPlans } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Planes() {
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const { plans, isLoading: plansLoading } = useSubscriptionPlans();

  if (subscriptionLoading || plansLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <div>Cargando planes...</div>
      </div>
    );
  }

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'FREE':
        return Zap;
      case 'MENSUAL':
        return Star;
      case 'ANUAL':
        return Crown;
      default:
        return Zap;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Gratis';
    const formattedPrice = (price / 100).toFixed(0);
    return `$${formattedPrice} USD`;
  };

  const getPlanFeatures = (planName: string) => {
    switch (planName) {
      case 'FREE':
        return [
          '5-10 casos de uso de IA',
          'Cursos certificados para industria seleccionada',
          'Guías diarias paso a paso',
          'Solo visualización de workshops en vivo',
          'Prueba gratis por 14 días'
        ];
      case 'MENSUAL':
        return [
          'Acceso completo a la universidad',
          '300+ guías paso a paso',
          'Workshops en vivo semanales',
          'Comunidad privada',
          'Certificados de finalización',
          'Descuentos en herramientas'
        ];
      case 'ANUAL':
        return [
          'Todo lo del Plan Mensual',
          '2 meses GRATIS',
          'Acceso prioritario a workshops',
          'Sesiones 1:1 mensuales',
          'Recursos exclusivos',
          'Garantía de 30 días'
        ];
      default:
        return [];
    }
  };

  const isCurrentPlan = (planName: string) => {
    return subscription?.plan === planName;
  };

  const isPlanHigher = (planName: string) => {
    const hierarchy = ['FREE', 'MENSUAL', 'ANUAL'];
    const currentIndex = hierarchy.indexOf(subscription?.plan || 'FREE');
    const planIndex = hierarchy.indexOf(planName);
    return planIndex > currentIndex;
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Planes de Suscripción</h1>
              <p className="text-gray-400 mt-2">
                Elige el plan perfecto para tu aprendizaje en NoCode e IA
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Plans Section */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid md:grid-cols-3 gap-8 mt-8">
          {plans && Array.isArray(plans) && plans.map((plan: any) => {
            const Icon = getPlanIcon(plan.name);
            const features = getPlanFeatures(plan.name);
            const isCurrent = isCurrentPlan(plan.name);
            const isHigher = isPlanHigher(plan.name);
            const isPopular = plan.name === 'MENSUAL';
            const isBest = plan.name === 'ANUAL';

            return (
              <div
                key={plan.id}
                className={`relative bg-dark-card border rounded-xl p-6 ${
                  isCurrent
                    ? 'border-green-500 bg-green-900/10'
                    : isHigher
                    ? 'border-purple-accent'
                    : 'border-dark-border'
                } ${isPopular || isBest ? 'scale-105' : ''}`}
              >
                {/* Popular/Best Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Más Popular</Badge>
                  </div>
                )}
                {isBest && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-yellow-600 text-white">Mejor Valor</Badge>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-600 text-white">Plan Actual</Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <Icon className="h-12 w-12 mx-auto mb-4 text-purple-accent" />
                  <h3 className="text-xl font-bold mb-2">{plan.display_name}</h3>
                  <div className="text-3xl font-bold">
                    {formatPrice(plan.price, plan.currency)}
                    {plan.name !== 'FREE' && (
                      <span className="text-sm text-gray-400 font-normal">
                        /{plan.billing_interval === 'month' ? 'mes' : 'año'}
                      </span>
                    )}
                  </div>
                  {plan.name === 'ANUAL' && (
                    <p className="text-sm text-yellow-400 mt-1">
                      ¡Ahorra $156 al año!
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="mt-auto">
                  {isCurrent ? (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled
                    >
                      Plan Actual
                    </Button>
                  ) : isHigher ? (
                    <Button 
                      className="w-full bg-purple-accent hover:bg-purple-accent/90 text-white"
                      onClick={() => {
                        // TODO: Implement subscription upgrade
                        alert('Funcionalidad de actualización en desarrollo');
                      }}
                    >
                      Actualizar Plan
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      className="w-full border-gray-600 text-gray-400"
                      disabled
                    >
                      Plan Básico
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-dark-card rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Preguntas Frecuentes</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
              <p className="text-gray-400 text-sm">
                Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios se aplicarán inmediatamente.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿Qué incluye la garantía de 30 días?</h3>
              <p className="text-gray-400 text-sm">
                Si no estás satisfecho con el Plan Anual, puedes solicitar un reembolso completo dentro de los primeros 30 días.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿Cómo funcionan las sesiones 1:1?</h3>
              <p className="text-gray-400 text-sm">
                Con el Plan Anual, tienes derecho a una sesión personal mensual de 30 minutos con nuestros expertos.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿Puedo cancelar en cualquier momento?</h3>
              <p className="text-gray-400 text-sm">
                Sí, puedes cancelar tu suscripción en cualquier momento. Mantendrás acceso hasta el final de tu período de facturación.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}