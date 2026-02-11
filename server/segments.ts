import { db } from './db';
import { userSegments, users, userSubscriptions, userProgress, userEvents } from '../shared/schema';
import { eq, and, or, gte, lte, sql, isNull, inArray, desc, count } from 'drizzle-orm';
import { storage } from './storage';

export interface SegmentRule {
  // Subscription filters
  subscriptionStatus?: 'active' | 'trial' | 'cancelled' | 'none';
  subscriptionPlanId?: string;
  
  // Progress filters
  minCoursesCompleted?: number;
  maxCoursesCompleted?: number;
  minLessonsCompleted?: number;
  hasCompletedCourse?: string; // courseId
  hasNotCompletedCourse?: string; // courseId
  
  // User attributes
  registeredAfter?: string; // ISO date string
  registeredBefore?: string; // ISO date string
  experienceLevel?: string[];
  workAreas?: string[]; // From onboarding
  learningMethods?: string[]; // From onboarding
  goals?: string[]; // From onboarding
  
  // Behavior filters
  hasTriggeredEvent?: string; // eventType
  hasNotTriggeredEvent?: string; // eventType
  lastLoginAfter?: string; // ISO date string
  lastLoginBefore?: string; // ISO date string
  isInactive?: boolean; // No login in last X days
  inactiveDays?: number; // Days of inactivity
  
  // Points/Level
  minPoints?: number;
  minLevel?: number;
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  rules: SegmentRule;
  userCount: number;
  lastCalculatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Calculate which users match a segment's rules
 */
export async function calculateSegmentUsers(segmentId: string): Promise<string[]> {
  const [segment] = await db
    .select()
    .from(userSegments)
    .where(eq(userSegments.id, segmentId));

  if (!segment) {
    throw new Error(`Segment ${segmentId} not found`);
  }

  const rules = segment.rules as SegmentRule;
  const userIds = await getUsersMatchingRules(rules);
  
  // Update segment with new count and timestamp
  await db
    .update(userSegments)
    .set({
      userCount: userIds.length,
      lastCalculatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userSegments.id, segmentId));

  return userIds;
}

/**
 * Get users matching segment rules
 */
export async function getUsersMatchingRules(rules: SegmentRule): Promise<string[]> {
  const conditions: any[] = [];

  // Subscription status filter
  if (rules.subscriptionStatus) {
    if (rules.subscriptionStatus === 'none') {
      // Users with no active subscription
      const usersWithSubs = await db
        .selectDistinct({ userId: userSubscriptions.userId })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.status, 'active'));
      
      const subUserIds = usersWithSubs.map(u => u.userId).filter(Boolean) as string[];
      if (subUserIds.length > 0) {
        conditions.push(sql`${users.id} NOT IN ${sql`(${sql.join(subUserIds.map(id => sql`${id}`), sql`, `)})`}`);
      }
    } else {
      const usersWithSubs = await db
        .selectDistinct({ userId: userSubscriptions.userId })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.status, rules.subscriptionStatus));
      
      const subUserIds = usersWithSubs.map(u => u.userId).filter(Boolean) as string[];
      if (subUserIds.length > 0) {
        conditions.push(inArray(users.id, subUserIds));
      } else {
        // No users match this subscription status
        return [];
      }
    }
  }

  // Subscription plan filter
  if (rules.subscriptionPlanId) {
    const usersWithPlan = await db
      .selectDistinct({ userId: userSubscriptions.userId })
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.planId, rules.subscriptionPlanId),
          eq(userSubscriptions.status, 'active')
        )
      );
    
    const planUserIds = usersWithPlan.map(u => u.userId).filter(Boolean) as string[];
    if (planUserIds.length > 0) {
      conditions.push(inArray(users.id, planUserIds));
    } else {
      return [];
    }
  }

  // Course completion filters
  if (rules.minCoursesCompleted !== undefined || rules.maxCoursesCompleted !== undefined) {
    const courseCompletions = await db
      .select({
        userId: userProgress.userId,
        count: sql<number>`COUNT(DISTINCT ${userProgress.courseId})::int`,
      })
      .from(userProgress)
      .where(eq(userProgress.isCompleted, true))
      .groupBy(userProgress.userId);

    let matchingUserIds: string[] = [];
    
    for (const completion of courseCompletions) {
      const courseCount = completion.count;
      if (rules.minCoursesCompleted !== undefined && courseCount < rules.minCoursesCompleted) continue;
      if (rules.maxCoursesCompleted !== undefined && courseCount > rules.maxCoursesCompleted) continue;
      if (completion.userId) matchingUserIds.push(completion.userId);
    }

    if (matchingUserIds.length > 0) {
      conditions.push(inArray(users.id, matchingUserIds));
    } else {
      return [];
    }
  }

  // Has completed specific course
  if (rules.hasCompletedCourse) {
    const usersCompleted = await db
      .selectDistinct({ userId: userProgress.userId })
      .from(userProgress)
      .where(
        and(
          eq(userProgress.courseId, rules.hasCompletedCourse),
          eq(userProgress.isCompleted, true)
        )
      );
    
    const completedUserIds = usersCompleted.map(u => u.userId).filter(Boolean) as string[];
    if (completedUserIds.length > 0) {
      conditions.push(inArray(users.id, completedUserIds));
    } else {
      return [];
    }
  }

  // Has NOT completed specific course
  if (rules.hasNotCompletedCourse) {
    const usersCompleted = await db
      .selectDistinct({ userId: userProgress.userId })
      .from(userProgress)
      .where(
        and(
          eq(userProgress.courseId, rules.hasNotCompletedCourse),
          eq(userProgress.isCompleted, true)
        )
      );
    
    const completedUserIds = usersCompleted.map(u => u.userId).filter(Boolean) as string[];
    if (completedUserIds.length > 0) {
      conditions.push(sql`${users.id} NOT IN ${sql`(${sql.join(completedUserIds.map(id => sql`${id}`), sql`, `)})`}`);
    }
  }

  // Registration date filters
  if (rules.registeredAfter) {
    conditions.push(gte(users.createdAt, new Date(rules.registeredAfter)));
  }
  if (rules.registeredBefore) {
    conditions.push(lte(users.createdAt, new Date(rules.registeredBefore)));
  }

  // Experience level filter
  if (rules.experienceLevel && rules.experienceLevel.length > 0) {
    conditions.push(inArray(users.experienceLevel, rules.experienceLevel));
  }

  // Last login filters
  if (rules.lastLoginAfter) {
    conditions.push(gte(users.lastLoginAt, new Date(rules.lastLoginAfter)));
  }
  if (rules.lastLoginBefore) {
    conditions.push(lte(users.lastLoginAt, new Date(rules.lastLoginBefore)));
  }

  // Inactivity filter
  if (rules.isInactive && rules.inactiveDays) {
    const inactiveDate = new Date();
    inactiveDate.setDate(inactiveDate.getDate() - rules.inactiveDays);
    conditions.push(
      or(
        isNull(users.lastLoginAt),
        lte(users.lastLoginAt, inactiveDate)
      )
    );
  }

  // Points filter
  if (rules.minPoints !== undefined) {
    conditions.push(sql`${users.points} >= ${rules.minPoints}`);
  }

  // Level filter
  if (rules.minLevel !== undefined) {
    conditions.push(sql`${users.level} >= ${rules.minLevel}`);
  }

  // Event filters
  if (rules.hasTriggeredEvent) {
    const usersWithEvent = await db
      .selectDistinct({ userId: userEvents.userId })
      .from(userEvents)
      .where(eq(userEvents.eventType, rules.hasTriggeredEvent));
    
    const eventUserIds = usersWithEvent.map(u => u.userId).filter(Boolean) as string[];
    if (eventUserIds.length > 0) {
      conditions.push(inArray(users.id, eventUserIds));
    } else {
      return [];
    }
  }

  if (rules.hasNotTriggeredEvent) {
    const usersWithEvent = await db
      .selectDistinct({ userId: userEvents.userId })
      .from(userEvents)
      .where(eq(userEvents.eventType, rules.hasNotTriggeredEvent));
    
    const eventUserIds = usersWithEvent.map(u => u.userId).filter(Boolean) as string[];
    if (eventUserIds.length > 0) {
      conditions.push(sql`${users.id} NOT IN ${sql`(${sql.join(eventUserIds.map(id => sql`${id}`), sql`, `)})`}`);
    }
  }

  // Build query
  if (conditions.length > 0) {
    const results = await db
      .selectDistinct({ id: users.id })
      .from(users)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions));
    return results.map(r => r.id);
  }

  const results = await db.selectDistinct({ id: users.id }).from(users);
  return results.map(r => r.id);
}

/**
 * Create a new segment
 */
export async function createSegment(data: {
  name: string;
  description?: string;
  rules: SegmentRule;
}): Promise<string> {
  try {
    // Ensure rules is a valid object
    const rules = data.rules || {};
    
    const [segment] = await db
      .insert(userSegments)
      .values({
        name: data.name,
        description: data.description || null,
        rules: rules,
        userCount: 0,
      })
      .returning({ id: userSegments.id });

    // Calculate initial user count
    if (segment) {
      try {
        await calculateSegmentUsers(segment.id);
      } catch (calcError: any) {
        console.error('Error calculating initial user count:', calcError.message);
        // Don't fail the creation if calculation fails
      }
      return segment.id;
    }

    throw new Error('Failed to create segment');
  } catch (error: any) {
    console.error('Error creating segment:', error);
    throw new Error(`Error al crear segmento: ${error.message}`);
  }
}

/**
 * Update a segment
 */
export async function updateSegment(
  segmentId: string,
  data: {
    name?: string;
    description?: string;
    rules?: SegmentRule;
  }
): Promise<void> {
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.rules !== undefined) {
    updateData.rules = data.rules;
    // Recalculate user count when rules change
    updateData.userCount = 0;
    updateData.lastCalculatedAt = null;
  }

  await db
    .update(userSegments)
    .set(updateData)
    .where(eq(userSegments.id, segmentId));

  // Recalculate if rules changed
  if (data.rules !== undefined) {
    await calculateSegmentUsers(segmentId);
  }
}

/**
 * Get all segments
 */
export async function getAllSegments(): Promise<Segment[]> {
  try {
    const segments = await db
      .select()
      .from(userSegments)
      .orderBy(desc(userSegments.createdAt));

    return segments.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description || undefined,
      rules: s.rules as SegmentRule,
      userCount: s.userCount || 0,
      lastCalculatedAt: s.lastCalculatedAt ? new Date(s.lastCalculatedAt) : undefined,
      createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
      updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
    }));
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
      console.warn('⚠️ Tabla user_segments no existe aún. Ejecuta la migración 0008_add_automations_tables.sql');
      return [];
    }
    throw error;
  }
}

/**
 * Get a segment by ID
 */
export async function getSegmentById(segmentId: string): Promise<Segment | null> {
  const [segment] = await db
    .select()
    .from(userSegments)
    .where(eq(userSegments.id, segmentId));

  if (!segment) return null;

  return {
    id: segment.id,
    name: segment.name,
    description: segment.description || undefined,
    rules: segment.rules as SegmentRule,
    userCount: segment.userCount || 0,
    lastCalculatedAt: segment.lastCalculatedAt ? new Date(segment.lastCalculatedAt) : undefined,
    createdAt: segment.createdAt ? new Date(segment.createdAt) : new Date(),
    updatedAt: segment.updatedAt ? new Date(segment.updatedAt) : new Date(),
  };
}

/**
 * Delete a segment
 */
export async function deleteSegment(segmentId: string): Promise<void> {
  await db
    .delete(userSegments)
    .where(eq(userSegments.id, segmentId));
}

/**
 * Recalculate all segments
 */
export async function recalculateAllSegments(): Promise<void> {
  try {
    const segments = await getAllSegments();
    
    if (segments.length === 0) {
      console.log('ℹ️ No hay segmentos para recalcular');
      return;
    }
    
    for (const segment of segments) {
      try {
        await calculateSegmentUsers(segment.id);
      } catch (error: any) {
        console.error(`Error recalculating segment ${segment.id}:`, error.message);
      }
    }
  } catch (error: any) {
    // If table doesn't exist, throw a more helpful error
    if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
      throw new Error('La tabla user_segments no existe. Por favor ejecuta la migración 0008_add_automations_tables.sql en tu base de datos.');
    }
    throw error;
  }
}

