import { db } from './db';
import { marketingAnalytics, users, userSubscriptions, userProgress, userEvents, subscriptionPlans } from '../shared/schema';
import { eq, and, gte, lte, sql, desc, count } from 'drizzle-orm';

export interface MarketingMetrics {
  conversions: {
    trialToPaid: number;
    trialToPaidRate: number;
    totalTrials: number;
    totalPaid: number;
  };
  engagement: {
    activeUsers: number;
    courseCompletions: number;
    averageCoursesPerUser: number;
  };
  churn: {
    churnRate: number;
    cancelledSubscriptions: number;
    totalSubscriptions: number;
  };
  revenue: {
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    totalRevenue: number;
  };
  events: {
    courseCompleted: number;
    lessonCompleted: number;
    onboardingCompleted: number;
  };
}

/**
 * Get comprehensive marketing analytics
 */
export async function getMarketingAnalytics(): Promise<MarketingMetrics> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Conversions
  const trialSubscriptions = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.status, 'trial'));

  const activeSubscriptions = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.status, 'active'));

  // Get users who converted from trial to paid
  const convertedUsers = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${userSubscriptions.userId})::int` })
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.status, 'active'),
        sql`EXISTS (
          SELECT 1 FROM ${userSubscriptions} us2 
          WHERE us2.user_id = ${userSubscriptions.userId} 
          AND us2.status = 'trial'
        )`
      )
    );

  const totalTrials = trialSubscriptions[0]?.count || 0;
  const totalPaid = activeSubscriptions[0]?.count || 0;
  const trialToPaid = convertedUsers[0]?.count || 0;
  const trialToPaidRate = totalTrials > 0 ? (trialToPaid / totalTrials) * 100 : 0;

  // Engagement
  const activeUsers = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${users.id})::int` })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo));

  const courseCompletions = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.isCompleted, true),
        gte(userProgress.completedAt || userProgress.updatedAt, thirtyDaysAgo)
      )
    );

  const usersWithCourses = await db
    .select({ 
      userId: userProgress.userId,
      courseCount: sql<number>`COUNT(DISTINCT ${userProgress.courseId})::int`
    })
    .from(userProgress)
    .groupBy(userProgress.userId);

  const totalCourses = usersWithCourses.reduce((sum, u) => sum + u.courseCount, 0);
  const averageCoursesPerUser = usersWithCourses.length > 0 
    ? totalCourses / usersWithCourses.length 
    : 0;

  // Churn
  const cancelledSubscriptions = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.status, 'cancelled'),
        gte(userSubscriptions.updatedAt, thirtyDaysAgo)
      )
    );

  const totalSubscriptions = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(userSubscriptions);

  const churnRate = (totalSubscriptions[0]?.count || 0) > 0
    ? ((cancelledSubscriptions[0]?.count || 0) / (totalSubscriptions[0]?.count || 0)) * 100
    : 0;

  // Revenue (simplified - would need actual payment data)
  const activeSubs = await db
    .select({
      subscription: userSubscriptions,
      plan: subscriptionPlans,
    })
    .from(userSubscriptions)
    .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
    .where(eq(userSubscriptions.status, 'active'));

  let mrr = 0;
  for (const sub of activeSubs) {
    if (sub.plan) {
      // Assume monthly price (would need to handle annual plans differently)
      mrr += sub.plan.price || 0;
    }
  }

  const arr = mrr * 12;
  const totalRevenue = mrr; // Simplified

  // Events (last 30 days)
  const courseCompletedEvents = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(userEvents)
    .where(
      and(
        eq(userEvents.eventType, 'course_completed'),
        gte(userEvents.createdAt, thirtyDaysAgo)
      )
    );

  const lessonCompletedEvents = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(userEvents)
    .where(
      and(
        eq(userEvents.eventType, 'lesson_completed'),
        gte(userEvents.createdAt, thirtyDaysAgo)
      )
    );

  const onboardingCompletedEvents = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(userEvents)
    .where(
      and(
        eq(userEvents.eventType, 'onboarding_completed'),
        gte(userEvents.createdAt, thirtyDaysAgo)
      )
    );

  return {
    conversions: {
      trialToPaid,
      trialToPaidRate: Math.round(trialToPaidRate * 100) / 100,
      totalTrials,
      totalPaid,
    },
    engagement: {
      activeUsers: activeUsers[0]?.count || 0,
      courseCompletions: courseCompletions[0]?.count || 0,
      averageCoursesPerUser: Math.round(averageCoursesPerUser * 100) / 100,
    },
    churn: {
      churnRate: Math.round(churnRate * 100) / 100,
      cancelledSubscriptions: cancelledSubscriptions[0]?.count || 0,
      totalSubscriptions: totalSubscriptions[0]?.count || 0,
    },
    revenue: {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    },
    events: {
      courseCompleted: courseCompletedEvents[0]?.count || 0,
      lessonCompleted: lessonCompletedEvents[0]?.count || 0,
      onboardingCompleted: onboardingCompletedEvents[0]?.count || 0,
    },
  };
  } catch (error: any) {
    // If tables don't exist, return default values
    if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
      console.warn('⚠️ Tablas de analytics no existen aún. Ejecuta la migración 0008_add_automations_tables.sql');
      return {
        conversions: { trialToPaid: 0, trialToPaidRate: 0, totalTrials: 0, totalPaid: 0 },
        engagement: { activeUsers: 0, courseCompletions: 0, averageCoursesPerUser: 0 },
        churn: { churnRate: 0, cancelledSubscriptions: 0, totalSubscriptions: 0 },
        revenue: { mrr: 0, arr: 0, totalRevenue: 0 },
        events: { courseCompleted: 0, lessonCompleted: 0, onboardingCompleted: 0 },
      };
    }
    throw error;
  }
}

