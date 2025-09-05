import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Star } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export function SubscriptionBadge() {
  const { subscription, isLoading } = useSubscription();

  if (isLoading || !subscription) {
    return null;
  }

  const getBadgeConfig = () => {
    switch (subscription.plan) {
      case 'FREE':
        return {
          label: 'Prueba Gratis',
          icon: Zap,
          className: 'bg-gray-100 text-gray-800 border-gray-300',
        };
      case 'MENSUAL':
        return {
          label: 'Plan Mensual',
          icon: Star,
          className: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'ANUAL':
        return {
          label: 'Plan Anual',
          icon: Crown,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        };
      default:
        return {
          label: 'Plan Básico',
          icon: Zap,
          className: 'bg-gray-100 text-gray-800 border-gray-300',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function SubscriptionStatus() {
  const { subscription, isLoading, isFreePlan, isPaidPlan } = useSubscription();

  if (isLoading || !subscription) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Tu Plan Actual
        </h3>
        <SubscriptionBadge />
      </div>

      {isFreePlan && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tienes acceso a {subscription.limits.aiUseCases} casos de uso de IA y {subscription.limits.guides} guías.
          </p>
          {subscription.trialEndsAt && (
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Tu prueba gratis termina el {new Date(subscription.trialEndsAt).toLocaleDateString('es-ES')}
            </p>
          )}
        </div>
      )}

      {isPaidPlan && (
        <div className="space-y-2">
          <p className="text-sm text-green-600 dark:text-green-400">
            ✅ Acceso completo a la universidad NoCode
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            ✅ 300+ guías paso a paso
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            ✅ Workshops en vivo semanales
          </p>
          {subscription.plan === 'ANUAL' && (
            <>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                ⭐ Acceso prioritario a workshops
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                ⭐ Sesiones 1:1 mensuales
              </p>
            </>
          )}
        </div>
      )}

      {isFreePlan && (
        <div className="pt-2 border-t">
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
            onClick={() => window.location.href = '/planes'}
          >
            Actualizar Plan
          </button>
        </div>
      )}
    </div>
  );
}