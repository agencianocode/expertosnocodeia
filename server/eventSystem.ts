import { db } from './db';
import { userEvents } from '../shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

export type EventType = 
  | 'course_completed'
  | 'lesson_completed'
  | 'course_started'
  | 'milestone_reached'
  | 'user_inactive'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'subscription_renewed'
  | 'trial_expiring'
  | 'onboarding_completed'
  | 'certificate_earned'
  | 'comment_posted'
  | 'community_post_created';

export interface EventData {
  [key: string]: any;
}

/**
 * Record a user event
 */
export async function recordEvent(
  userId: string,
  eventType: EventType,
  eventData?: EventData
): Promise<string> {
  const [event] = await db
    .insert(userEvents)
    .values({
      userId,
      eventType,
      eventData: eventData || {},
    })
    .returning();

  return event.id;
}

/**
 * Get user events
 */
export async function getUserEvents(
  userId: string,
  eventType?: EventType,
  limit: number = 100
) {
  const conditions = [eq(userEvents.userId, userId)];
  
  if (eventType) {
    conditions.push(eq(userEvents.eventType, eventType));
  }

  return await db
    .select()
    .from(userEvents)
    .where(and(...conditions))
    .orderBy(desc(userEvents.createdAt))
    .limit(limit);
}

/**
 * Check if user has triggered a specific event
 */
export async function hasUserTriggeredEvent(
  userId: string,
  eventType: EventType,
  since?: Date
): Promise<boolean> {
  const conditions = [
    eq(userEvents.userId, userId),
    eq(userEvents.eventType, eventType)
  ];

  if (since) {
    conditions.push(gte(userEvents.createdAt, since));
  }

  const result = await db
    .select()
    .from(userEvents)
    .where(and(...conditions))
    .limit(1);

  return result.length > 0;
}

