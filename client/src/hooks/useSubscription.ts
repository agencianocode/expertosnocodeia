import { useQuery } from "@tanstack/react-query";

export interface SubscriptionInfo {
  plan: 'FREE' | 'MENSUAL' | 'ANUAL';
  status: string;
  isActive: boolean;
  features: string[];
  limits: {
    aiUseCases: number;
    guides: number;
    workshopsPerMonth: number;
    certificatesPerMonth: number;
    monthlyOneOnOnes?: number;
  };
  startDate?: string;
  endDate?: string;
  trialEndsAt?: string;
}

export function useSubscription() {
  const { data: subscription, isLoading, error, refetch } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription/info"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasFeature = (feature: string): boolean => {
    return subscription?.features?.includes(feature) ?? false;
  };

  const isFreePlan = subscription?.plan === 'FREE';
  const isMensualPlan = subscription?.plan === 'MENSUAL';
  const isAnualPlan = subscription?.plan === 'ANUAL';
  const isPaidPlan = isMensualPlan || isAnualPlan;

  // Check if user has access to specific features
  const canAccessUniversity = hasFeature('university_full_access');
  const canAccessAllGuides = hasFeature('guides_300_plus');
  const canJoinWorkshops = hasFeature('live_workshops_full');
  const canAccessCommunity = hasFeature('private_community');
  const canGetCertificates = hasFeature('completion_certificates');
  const hasToolDiscounts = hasFeature('tool_discounts');
  const hasOneOnOneSessions = hasFeature('monthly_1on1_sessions');
  const hasPriorityAccess = hasFeature('priority_workshop_access');

  // Get usage limits
  const aiUseCaseLimit = subscription?.limits?.aiUseCases ?? 0;
  const guideLimit = subscription?.limits?.guides ?? 0;
  const workshopLimit = subscription?.limits?.workshopsPerMonth ?? 0;
  const certificateLimit = subscription?.limits?.certificatesPerMonth ?? 0;

  const isUnlimited = (limit: number) => limit === -1;

  return {
    subscription,
    isLoading,
    error,
    refetch,
    
    // Plan checks
    isFreePlan,
    isMensualPlan,
    isAnualPlan,
    isPaidPlan,
    
    // Feature access
    canAccessUniversity,
    canAccessAllGuides,
    canJoinWorkshops,
    canAccessCommunity,
    canGetCertificates,
    hasToolDiscounts,
    hasOneOnOneSessions,
    hasPriorityAccess,
    
    // Limits and usage
    aiUseCaseLimit,
    guideLimit,
    workshopLimit,
    certificateLimit,
    isUnlimited,
    
    // Helper function
    hasFeature,
  };
}

export function useSubscriptionPlans() {
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ["/api/subscription/plans"],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    plans,
    isLoading,
    error,
  };
}