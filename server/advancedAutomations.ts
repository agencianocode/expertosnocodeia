import { db } from './db';
import { automations, automationLogs, userEvents, users, userProgress, userSubscriptions } from '../shared/schema';
import { eq, and, or, gte, lte, sql, isNull, inArray, desc } from 'drizzle-orm';
import { recordEvent, EventType } from './eventSystem';
import { sendEmail } from './emailMarketing';
import { subscribeToBeehiiv, updateBeehiivSubscriber } from './beehiiv';
import { storage } from './storage';

export interface AutomationTrigger {
  type: 'event' | 'schedule' | 'segment';
  config: {
    eventType?: EventType;
    schedule?: string; // Cron expression
    segmentId?: string;
  };
}

export interface AutomationAction {
  type: 'email' | 'tag' | 'webhook' | 'beehiiv_tag';
  config: {
    emailTemplate?: string;
    emailSubject?: string;
    tagName?: string;
    webhookUrl?: string;
    beehiivTag?: string;
  };
}

/**
 * Process all active automations
 */
export async function processAutomations(): Promise<void> {
  console.log('🔄 Procesando automatizaciones avanzadas...');

  const activeAutomations = await db
    .select()
    .from(automations)
    .where(eq(automations.isActive, true));

  for (const automation of activeAutomations) {
    try {
      await processAutomation(automation);
    } catch (error: any) {
      console.error(`❌ Error procesando automatización ${automation.id}:`, error.message);
      await logAutomationExecution(automation.id, null, null, 'failed', {
        error: error.message,
      });
    }
  }

  console.log('✅ Automatizaciones avanzadas procesadas');
}

/**
 * Process a single automation
 */
async function processAutomation(automation: any): Promise<void> {
  const triggerConfig = automation.triggerConfig as AutomationTrigger['config'];
  const actionConfig = automation.actionConfig as AutomationAction['config'];
  const segmentRules = automation.segmentRules as any;

  // Get users who match the trigger and segment rules
  const targetUsers = await getTargetUsers(automation.triggerType, triggerConfig, segmentRules);

  for (const user of targetUsers) {
    // Check if automation already executed for this user (prevent duplicates)
    const alreadyExecuted = await checkIfAlreadyExecuted(automation.id, user.id, triggerConfig);
    if (alreadyExecuted) {
      continue;
    }

    try {
      // Execute the action
      await executeAction(user, automation.actionType, actionConfig);
      
      // Log successful execution
      await logAutomationExecution(automation.id, user.id, null, 'success', {
        actionType: automation.actionType,
      });
    } catch (error: any) {
      console.error(`❌ Error ejecutando acción para usuario ${user.id}:`, error.message);
      await logAutomationExecution(automation.id, user.id, null, 'failed', {
        error: error.message,
      });
    }
  }
}

/**
 * Get target users based on trigger and segment rules
 */
async function getTargetUsers(
  triggerType: string,
  triggerConfig: any,
  segmentRules?: any
): Promise<any[]> {
  let userIds: string[] | null = null;
  const conditions: any[] = [];

  // Apply trigger-specific filters first
  if (triggerType === 'event' && triggerConfig.eventType) {
    const recentEvents = await db
      .select({ userId: userEvents.userId })
      .from(userEvents)
      .where(
        and(
          eq(userEvents.eventType, triggerConfig.eventType),
          gte(userEvents.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
        )
      )
      .groupBy(userEvents.userId);

    if (recentEvents.length === 0) {
      return [];
    }

    userIds = recentEvents.map(e => e.userId).filter((id): id is string => id !== null);
  }

  // Check if segmentId is provided (predefined segment)
  if (triggerConfig.segmentId) {
    try {
      const { getSegmentById, calculateSegmentUsers } = await import('./segments');
      const segment = await getSegmentById(triggerConfig.segmentId);
      
      if (segment) {
        const userIds = await calculateSegmentUsers(triggerConfig.segmentId);
        if (userIds.length > 0) {
          const segmentUsers = await db
            .select()
            .from(users)
            .where(inArray(users.id, userIds));
          
          return segmentUsers;
        }
        return [];
      }
    } catch (error: any) {
      console.error(`Error loading segment ${triggerConfig.segmentId}:`, error.message);
      // Fall through to regular segment rules
    }
  }

  // Apply segment rules
  if (segmentRules) {
    if (segmentRules.subscriptionStatus) {
      const usersWithSubs = await db
        .select({ userId: userSubscriptions.userId })
        .from(userSubscriptions)
        .where(
          segmentRules.subscriptionStatus === 'none'
            ? eq(userSubscriptions.status, 'active')
            : eq(userSubscriptions.status, segmentRules.subscriptionStatus)
        );

      const subUserIds = usersWithSubs.map(s => s.userId).filter((id): id is string => id !== null);
      
      if (segmentRules.subscriptionStatus === 'none') {
        if (userIds) {
          userIds = userIds.filter(id => !subUserIds.includes(id));
        } else {
          const allUsers = await db.select({ id: users.id }).from(users);
          userIds = allUsers.map(u => u.id).filter(id => !subUserIds.includes(id));
        }
      } else {
        if (subUserIds.length === 0) return [];
        if (userIds) {
          userIds = userIds.filter(id => subUserIds.includes(id));
        } else {
          userIds = subUserIds;
        }
      }
    }

    if (segmentRules.minCoursesCompleted) {
      const usersWithProgress = await db
        .select({ userId: userProgress.userId })
        .from(userProgress)
        .where(eq(userProgress.isCompleted, true))
        .groupBy(userProgress.userId)
        .having(sql`COUNT(*) >= ${segmentRules.minCoursesCompleted}`);

      const progressUserIds = usersWithProgress.map(p => p.userId).filter((id): id is string => id !== null);
      if (progressUserIds.length === 0) return [];

      if (userIds) {
        userIds = userIds.filter(id => progressUserIds.includes(id));
      } else {
        userIds = progressUserIds;
      }
    }

    if (segmentRules.registeredAfter) {
      conditions.push(gte(users.createdAt, new Date(segmentRules.registeredAfter)));
    }
    if (segmentRules.registeredBefore) {
      conditions.push(lte(users.createdAt, new Date(segmentRules.registeredBefore)));
    }
  }

  if (userIds && userIds.length === 0) {
    return [];
  }

  if (userIds && userIds.length > 0) {
    conditions.push(inArray(users.id, userIds));
  }

  if (conditions.length > 0) {
    return await db.select().from(users).where(and(...conditions));
  }

  return await db.select().from(users);
}

/**
 * Check if automation already executed for this user
 */
async function checkIfAlreadyExecuted(
  automationId: string,
  userId: string,
  triggerConfig: any
): Promise<boolean> {
  // For event-based triggers, check if we already processed this event
  if (triggerConfig.eventType) {
    const recentLog = await db
      .select()
      .from(automationLogs)
      .where(
        and(
          eq(automationLogs.automationId, automationId),
          eq(automationLogs.userId, userId),
          eq(automationLogs.status, 'success'),
          gte(automationLogs.executedAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
        )
      )
      .limit(1);

    return recentLog.length > 0;
  }

  return false;
}

/**
 * Execute automation action
 */
async function executeAction(user: any, actionType: string, actionConfig: any): Promise<void> {
  switch (actionType) {
    case 'email':
      if (actionConfig.emailTemplate && user.email) {
        // Replace template variables
        let emailContent = actionConfig.emailTemplate;
        emailContent = emailContent.replace(/\{\{firstName\}\}/g, user.firstName || 'Usuario');
        emailContent = emailContent.replace(/\{\{lastName\}\}/g, user.lastName || '');
        emailContent = emailContent.replace(/\{\{email\}\}/g, user.email);

        await sendEmail({
          to: user.email,
          subject: actionConfig.emailSubject || 'Notificación',
          html: emailContent,
        });
      }
      break;

    case 'beehiiv_tag':
      if (actionConfig.beehiivTag && user.email) {
        try {
          await updateBeehiivSubscriber({
            email: user.email,
            tags: [actionConfig.beehiivTag],
          });
        } catch (error: any) {
          console.error(`Error agregando tag Beehiiv a ${user.email}:`, error.message);
        }
      }
      break;

    case 'webhook':
      if (actionConfig.webhookUrl) {
        try {
          await fetch(actionConfig.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            }),
          });
        } catch (error: any) {
          console.error(`Error llamando webhook para ${user.id}:`, error.message);
          throw error;
        }
      }
      break;

    default:
      console.warn(`Tipo de acción desconocido: ${actionType}`);
  }
}

/**
 * Log automation execution
 */
async function logAutomationExecution(
  automationId: string,
  userId: string | null,
  eventId: string | null,
  status: 'success' | 'failed' | 'skipped',
  result?: any
): Promise<void> {
  await db.insert(automationLogs).values({
    automationId,
    userId,
    eventId,
    status,
    result: result || {},
    errorMessage: status === 'failed' ? result?.error : null,
  });
}

/**
 * Create a new automation
 */
export async function createAutomation(data: {
  name: string;
  description?: string;
  triggerType: 'event' | 'schedule' | 'segment';
  triggerConfig: any;
  actionType: 'email' | 'tag' | 'webhook' | 'beehiiv_tag';
  actionConfig: any;
  segmentRules?: any;
  isActive?: boolean;
}): Promise<string> {
  const [automation] = await db
    .insert(automations)
    .values({
      name: data.name,
      description: data.description,
      triggerType: data.triggerType,
      triggerConfig: data.triggerConfig,
      actionType: data.actionType,
      actionConfig: data.actionConfig,
      segmentRules: data.segmentRules || {},
      isActive: data.isActive !== false,
    })
    .returning();

  return automation.id;
}

/**
 * Update an automation
 */
export async function updateAutomation(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    triggerConfig: any;
    actionConfig: any;
    segmentRules: any;
    isActive: boolean;
  }>
): Promise<void> {
  await db
    .update(automations)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(automations.id, id));
}

/**
 * Get all automations
 */
export async function getAllAutomations() {
  try {
    return await db.select().from(automations).orderBy(desc(automations.createdAt));
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
      console.warn('⚠️ Tabla automations no existe aún. Ejecuta la migración 0008_add_automations_tables.sql');
      return [];
    }
    throw error;
  }
}

/**
 * Get automation logs
 */
export async function getAutomationLogs(automationId?: string, limit: number = 100) {
  const baseQuery = db
    .select({
      log: automationLogs,
      automation: automations,
      user: users,
    })
    .from(automationLogs)
    .leftJoin(automations, eq(automationLogs.automationId, automations.id))
    .leftJoin(users, eq(automationLogs.userId, users.id));

  if (automationId) {
    return await baseQuery
      .where(eq(automationLogs.automationId, automationId))
      .orderBy(desc(automationLogs.executedAt))
      .limit(limit);
  }

  return await baseQuery
    .orderBy(desc(automationLogs.executedAt))
    .limit(limit);
}

