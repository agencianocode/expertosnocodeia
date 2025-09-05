import type { Request, Response, NextFunction, RequestHandler } from "express";
import { storage } from "./storage";

// Extended request interface with subscription data
export interface SubscriptionRequest extends Request {
  user?: any;
  subscription?: {
    plan: string;
    status: string;
    isActive: boolean;
    limits: any;
    features: string[];
  };
}

// Plan types
export type PlanType = 'FREE' | 'MENSUAL' | 'ANUAL';

// Feature definitions for each plan
export const PLAN_FEATURES = {
  FREE: [
    'ai_use_cases_limited', // 5-10 casos de uso
    'industry_courses_limited', // Cursos certificados para industria seleccionada
    'daily_guides', // Guías diarias paso a paso
    'live_workshops_view_only' // Solo ver workshops en vivo
  ],
  MENSUAL: [
    'university_full_access', // Acceso completo a la universidad
    'guides_300_plus', // 300+ guías paso a paso
    'live_workshops_full', // Workshops en vivo semanales
    'private_community', // Comunidad privada
    'completion_certificates', // Certificados de finalización
    'tool_discounts' // Descuentos en herramientas
  ],
  ANUAL: [
    'university_full_access',
    'guides_300_plus',
    'live_workshops_full',
    'private_community',
    'completion_certificates',
    'tool_discounts',
    'two_months_free', // 2 meses GRATIS
    'priority_workshop_access', // Acceso prioritario a workshops
    'monthly_1on1_sessions', // Sesiones 1:1 mensuales
    'exclusive_resources', // Recursos exclusivos
    'thirty_day_guarantee' // Garantía de 30 días
  ]
};

// Usage limits for each plan
export const PLAN_LIMITS = {
  FREE: {
    aiUseCases: 10,
    guides: 50,
    workshopsPerMonth: 0, // Solo ver
    certificatesPerMonth: 0
  },
  MENSUAL: {
    aiUseCases: -1, // Unlimited
    guides: -1, // Unlimited (300+)
    workshopsPerMonth: -1, // Unlimited
    certificatesPerMonth: -1 // Unlimited
  },
  ANUAL: {
    aiUseCases: -1, // Unlimited
    guides: -1, // Unlimited (300+)
    workshopsPerMonth: -1, // Unlimited + priority
    certificatesPerMonth: -1, // Unlimited
    monthlyOneOnOnes: 1 // 1 session per month
  }
};

/**
 * Middleware to verify user subscription and add subscription info to request
 */
export const requireSubscription: RequestHandler = async (
  req: SubscriptionRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.claims?.sub) {
      console.log('💳 No user authentication found');
      return res.status(401).json({ 
        message: "Unauthorized",
        reason: "authentication_required"
      });
    }

    const userId = req.user.claims.sub;
    console.log(`💳 Checking subscription for user: ${userId.substring(0, 8)}...`);

    // Get user's active subscription
    const subscription = await storage.getUserActiveSubscription(userId);
    
    if (!subscription) {
      console.log('💳 No active subscription found - assigning FREE plan');
      // No subscription = FREE plan (trial)
      req.subscription = {
        plan: 'FREE',
        status: 'trial',
        isActive: true,
        limits: PLAN_LIMITS.FREE,
        features: PLAN_FEATURES.FREE
      };
    } else {
      // Get plan details
      const plan = await storage.getSubscriptionPlanByName(subscription.planId);
      const planName = plan?.name as PlanType || 'FREE';
      
      // Check if subscription is active and not expired
      const isActive = subscription.status === 'active' && 
        (!subscription.endDate || new Date(subscription.endDate) > new Date());
      
      console.log(`💳 Found subscription: ${planName}, status: ${subscription.status}, active: ${isActive}`);
      
      req.subscription = {
        plan: planName,
        status: subscription.status,
        isActive,
        limits: PLAN_LIMITS[planName] || PLAN_LIMITS.FREE,
        features: PLAN_FEATURES[planName] || PLAN_FEATURES.FREE
      };
    }

    next();
  } catch (error) {
    console.error('💳 Subscription check error:', error);
    return res.status(500).json({ 
      message: "Internal server error",
      reason: "subscription_check_failed"
    });
  }
};

/**
 * Middleware factory to require specific plan or higher
 */
export function requirePlan(minPlan: PlanType): RequestHandler {
  const planHierarchy: PlanType[] = ['FREE', 'MENSUAL', 'ANUAL'];
  const minPlanIndex = planHierarchy.indexOf(minPlan);
  
  return (req: SubscriptionRequest, res: Response, next: NextFunction) => {
    if (!req.subscription) {
      return res.status(401).json({ 
        message: "Subscription required",
        reason: "subscription_not_checked"
      });
    }

    const userPlanIndex = planHierarchy.indexOf(req.subscription.plan as PlanType);
    
    if (userPlanIndex < minPlanIndex || !req.subscription.isActive) {
      console.log(`💳 Access denied: User has ${req.subscription.plan}, requires ${minPlan}`);
      return res.status(403).json({ 
        message: "Plan upgrade required",
        reason: "insufficient_plan",
        currentPlan: req.subscription.plan,
        requiredPlan: minPlan,
        upgradeUrl: "/planes" // URL to upgrade page
      });
    }

    console.log(`💳 Access granted: ${req.subscription.plan} >= ${minPlan}`);
    next();
  };
}

/**
 * Middleware factory to require specific feature
 */
export function requireFeature(feature: string): RequestHandler {
  return (req: SubscriptionRequest, res: Response, next: NextFunction) => {
    if (!req.subscription) {
      return res.status(401).json({ 
        message: "Subscription required",
        reason: "subscription_not_checked"
      });
    }

    if (!req.subscription.features.includes(feature) || !req.subscription.isActive) {
      console.log(`💳 Feature access denied: ${feature} not in ${req.subscription.plan} plan`);
      return res.status(403).json({ 
        message: "Feature not available in your plan",
        reason: "feature_not_available",
        requiredFeature: feature,
        currentPlan: req.subscription.plan,
        upgradeUrl: "/planes"
      });
    }

    console.log(`💳 Feature access granted: ${feature}`);
    next();
  };
}

/**
 * Middleware to check usage limits for a specific resource
 */
export function checkUsageLimit(resourceType: string): RequestHandler {
  return async (req: SubscriptionRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.subscription) {
        return res.status(401).json({ 
          message: "Subscription required",
          reason: "subscription_not_checked"
        });
      }

      const userId = req.user.claims.sub;
      const limit = req.subscription.limits[resourceType];
      
      // -1 means unlimited
      if (limit === -1) {
        console.log(`💳 Usage check: Unlimited ${resourceType} for ${req.subscription.plan}`);
        return next();
      }

      // Check current usage this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const currentUsage = await storage.getUserUsageCount(userId, resourceType, startOfMonth);
      
      if (currentUsage >= limit) {
        console.log(`💳 Usage limit exceeded: ${currentUsage}/${limit} ${resourceType}`);
        return res.status(403).json({ 
          message: "Usage limit exceeded for this month",
          reason: "usage_limit_exceeded",
          resourceType,
          currentUsage,
          limit,
          upgradeUrl: "/planes"
        });
      }

      console.log(`💳 Usage check passed: ${currentUsage}/${limit} ${resourceType}`);
      next();
    } catch (error) {
      console.error('💳 Usage limit check error:', error);
      return res.status(500).json({ 
        message: "Internal server error",
        reason: "usage_check_failed"
      });
    }
  };
}

/**
 * Helper function to track resource usage
 */
export async function trackUsage(userId: string, resourceType: string, resourceId?: string) {
  try {
    await storage.trackUserUsage({
      userId,
      resourceType,
      resourceId,
      usageDate: new Date(),
      metadata: {}
    });
    console.log(`💳 Usage tracked: ${resourceType} for user ${userId.substring(0, 8)}...`);
  } catch (error) {
    console.error('💳 Usage tracking error:', error);
  }
}

/**
 * Get user subscription info for frontend
 */
export async function getUserSubscriptionInfo(userId: string) {
  try {
    const subscription = await storage.getUserActiveSubscription(userId);
    
    if (!subscription) {
      return {
        plan: 'FREE',
        status: 'trial',
        isActive: true,
        features: PLAN_FEATURES.FREE,
        limits: PLAN_LIMITS.FREE,
        trialEndsAt: null
      };
    }

    const plan = await storage.getSubscriptionPlanByName(subscription.planId);
    const planName = plan?.name as PlanType || 'FREE';
    const isActive = subscription.status === 'active' && 
      (!subscription.endDate || new Date(subscription.endDate) > new Date());

    return {
      plan: planName,
      status: subscription.status,
      isActive,
      features: PLAN_FEATURES[planName] || PLAN_FEATURES.FREE,
      limits: PLAN_LIMITS[planName] || PLAN_LIMITS.FREE,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      trialEndsAt: subscription.trialEndsAt
    };
  } catch (error) {
    console.error('💳 Get subscription info error:', error);
    return null;
  }
}