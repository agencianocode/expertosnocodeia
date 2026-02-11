import { storage } from './storage';
import { 
  sendWelcomeEmail, 
  sendTrialReminderEmail, 
  sendOnboardingEmail,
  sendCancellationRecoveryEmail,
  sendReEngagementEmail 
} from './emailMarketing';
import { eq, and, sql, gte, lte, isNull, or } from 'drizzle-orm';
import { db } from './db';
import { users, userSubscriptions } from '../shared/schema';

/**
 * Run all email automations
 * This should be called periodically (e.g., daily via cron job)
 */
export async function runEmailAutomations(): Promise<void> {
  console.log('🔄 Iniciando automatizaciones de email...');

  try {
    // Run all automations in parallel
    await Promise.all([
      processWelcomeEmails(),
      processTrialReminders(),
      processOnboardingSequence(),
      processCancellationRecovery(),
      processReEngagement(),
    ]);

    console.log('✅ Automatizaciones de email completadas');
  } catch (error: any) {
    console.error('❌ Error en automatizaciones de email:', error);
    throw error;
  }
}

/**
 * Send welcome email to new users (registered in last 24 hours)
 */
async function processWelcomeEmails(): Promise<void> {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const newUsers = await db
      .select()
      .from(users)
      .where(
        and(
          gte(users.createdAt, oneDayAgo),
          sql`${users.email} IS NOT NULL`
        )
      );

    for (const user of newUsers) {
      if (user.email && user.firstName) {
        try {
          await sendWelcomeEmail(user.email, user.firstName);
          console.log(`✅ Email de bienvenida enviado a ${user.email}`);
        } catch (error: any) {
          console.error(`❌ Error enviando bienvenida a ${user.email}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error procesando emails de bienvenida:', error);
  }
}

/**
 * Send trial reminder emails based on trial expiration
 */
async function processTrialReminders(): Promise<void> {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get users with active trial subscriptions
    const trialUsers = await db
      .select({
        user: users,
        subscription: userSubscriptions,
      })
      .from(userSubscriptions)
      .innerJoin(users, eq(userSubscriptions.userId, users.id))
      .where(
        and(
          eq(userSubscriptions.status, 'trial'),
          sql`${userSubscriptions.endDate} IS NOT NULL`
        )
      );

    for (const { user, subscription } of trialUsers) {
      if (!user.email || !subscription.endDate) continue;

      const endsAt = new Date(subscription.endDate);
      const daysRemaining = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Send reminders on specific days
      if (daysRemaining === 7 || daysRemaining === 2 || daysRemaining === 0) {
        try {
          await sendTrialReminderEmail(
            user.email,
            user.firstName || 'Usuario',
            daysRemaining
          );
          console.log(`✅ Recordatorio de trial enviado a ${user.email} (${daysRemaining} días restantes)`);
        } catch (error: any) {
          console.error(`❌ Error enviando recordatorio a ${user.email}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error procesando recordatorios de trial:', error);
  }
}

/**
 * Send onboarding sequence emails
 * Day 1: Welcome (handled by processWelcomeEmails)
 * Day 2: Course recommendations
 * Day 4: Tips
 * Day 7: Certificates
 * Day 10: Community
 */
async function processOnboardingSequence(): Promise<void> {
  try {
    const now = new Date();
    
    // Day 2 (1 day after registration)
    const day2Users = await getUsersRegisteredDaysAgo(1);
    for (const user of day2Users) {
      if (user.email && user.firstName) {
        try {
          await sendOnboardingEmail(user.email, user.firstName, 2);
          console.log(`✅ Email de onboarding #2 enviado a ${user.email}`);
        } catch (error: any) {
          console.error(`❌ Error enviando onboarding #2 a ${user.email}:`, error.message);
        }
      }
    }

    // Day 4 (3 days after registration)
    const day4Users = await getUsersRegisteredDaysAgo(3);
    for (const user of day4Users) {
      if (user.email && user.firstName) {
        try {
          await sendOnboardingEmail(user.email, user.firstName, 3);
          console.log(`✅ Email de onboarding #3 enviado a ${user.email}`);
        } catch (error: any) {
          console.error(`❌ Error enviando onboarding #3 a ${user.email}:`, error.message);
        }
      }
    }

    // Day 7 (6 days after registration)
    const day7Users = await getUsersRegisteredDaysAgo(6);
    for (const user of day7Users) {
      if (user.email && user.firstName) {
        try {
          await sendOnboardingEmail(user.email, user.firstName, 4);
          console.log(`✅ Email de onboarding #4 enviado a ${user.email}`);
        } catch (error: any) {
          console.error(`❌ Error enviando onboarding #4 a ${user.email}:`, error.message);
        }
      }
    }

    // Day 10 (9 days after registration)
    const day10Users = await getUsersRegisteredDaysAgo(9);
    for (const user of day10Users) {
      if (user.email && user.firstName) {
        try {
          await sendOnboardingEmail(user.email, user.firstName, 5);
          console.log(`✅ Email de onboarding #5 enviado a ${user.email}`);
        } catch (error: any) {
          console.error(`❌ Error enviando onboarding #5 a ${user.email}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error procesando secuencia de onboarding:', error);
  }
}

/**
 * Send cancellation recovery emails to recently cancelled users
 */
async function processCancellationRecovery(): Promise<void> {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get users who cancelled in the last 1-3 days
    const cancelledUsers = await db
      .select({
        user: users,
        subscription: userSubscriptions,
      })
      .from(userSubscriptions)
      .innerJoin(users, eq(userSubscriptions.userId, users.id))
      .where(
        and(
          eq(userSubscriptions.status, 'cancelled'),
          gte(userSubscriptions.updatedAt, threeDaysAgo),
          lte(userSubscriptions.updatedAt, oneDayAgo)
        )
      );

    for (const { user } of cancelledUsers) {
      if (user.email && user.firstName) {
        try {
          await sendCancellationRecoveryEmail(user.email, user.firstName);
          console.log(`✅ Email de recuperación enviado a ${user.email}`);
        } catch (error: any) {
          console.error(`❌ Error enviando recuperación a ${user.email}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error procesando recuperación de cancelaciones:', error);
  }
}

/**
 * Send re-engagement emails to inactive users
 */
async function processReEngagement(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get users who haven't logged in for 30-60 days
    // Note: This assumes you have a lastLogin field. Adjust based on your schema.
    const inactiveUsers = await db
      .select()
      .from(users)
      .where(
        and(
          sql`${users.email} IS NOT NULL`,
          // If you have a lastLogin field, use it here
          // Otherwise, use createdAt as a proxy
          lte(users.createdAt, thirtyDaysAgo),
          gte(users.createdAt, sixtyDaysAgo)
        )
      );

    for (const user of inactiveUsers) {
      if (user.email && user.firstName && user.createdAt) {
        const daysInactive = Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        
        try {
          await sendReEngagementEmail(user.email, user.firstName, daysInactive);
          console.log(`✅ Email de re-engagement enviado a ${user.email} (${daysInactive} días inactivo)`);
        } catch (error: any) {
          console.error(`❌ Error enviando re-engagement a ${user.email}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error procesando re-engagement:', error);
  }
}

/**
 * Helper: Get users registered N days ago
 */
async function getUsersRegisteredDaysAgo(days: number) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - days);
  targetDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  return await db
    .select()
    .from(users)
    .where(
      and(
        gte(users.createdAt, targetDate),
        lte(users.createdAt, nextDay),
        sql`${users.email} IS NOT NULL`
      )
    );
}

