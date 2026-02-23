import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

import Stripe from 'stripe';
import { storage } from './storage';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY no está configurada. Las funciones de Stripe no funcionarán.');
} else {
  console.log('✅ Stripe configurado correctamente');
}

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
    })
  : null;

/**
 * Create a Stripe Checkout Session for subscription (Embedded)
 */
export async function createEmbeddedCheckoutSession(
  userId: string,
  planId: string,
  userEmail: string
): Promise<{ clientSecret: string; sessionId: string }> {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Verifica STRIPE_SECRET_KEY en las variables de entorno.');
  }

  // Get plan details from database
  const plan = await storage.getSubscriptionPlan(planId);
  if (!plan) {
    throw new Error(`Plan no encontrado: ${planId}`);
  }

  // Determine if it's a subscription or one-time payment
  const isSubscription = plan.billingInterval !== 'trial' && plan.price > 0;
  
  // Create or get Stripe customer
  let customerId: string;
  const existingSubscription = await storage.getUserActiveSubscription(userId);
  
  const metadata = existingSubscription?.metadata as Record<string, any> | undefined;
  if (metadata?.stripeCustomerId) {
    customerId = metadata.stripeCustomerId as string;
  } else {
    // Create new customer
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: {
        userId: userId,
      },
    });
    customerId = customer.id;
  }

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  const returnUrl = `${baseUrl}/checkout-return?session_id={CHECKOUT_SESSION_ID}`;

  if (isSubscription) {
    // Create Stripe Price if it doesn't exist
    const price = await stripe.prices.create({
      currency: plan.currency.toLowerCase(),
      unit_amount: plan.price,
      recurring: {
        interval: plan.billingInterval === 'year' ? 'year' : 'month',
      },
      product_data: {
        name: plan.displayName,
      },
    });

    // Create EMBEDDED checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded', // 🔑 Modo embebido
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      return_url: returnUrl,
      metadata: {
        userId: userId,
        planId: planId,
        planName: plan.name,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          planId: planId,
          planName: plan.name,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: false,
      },
    });

    return {
      clientSecret: session.client_secret!,
      sessionId: session.id,
    };
  } else {
    // One-time payment (for trial activation or special plans)
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            unit_amount: plan.price,
            product_data: {
              name: plan.displayName,
              description: `Plan ${plan.displayName}`,
            },
          },
          quantity: 1,
        },
      ],
      return_url: returnUrl,
      metadata: {
        userId: userId,
        planId: planId,
        planName: plan.name,
      },
    });

    return {
      clientSecret: session.client_secret!,
      sessionId: session.id,
    };
  }
}

/**
 * Create embedded checkout session for GUEST (no auth).
 * Sin email: Stripe muestra el formulario completo (email + tarjeta) como en The Rundown.
 */
export async function createEmbeddedCheckoutSessionGuest(
  planId: string
): Promise<{ clientSecret: string; sessionId: string }> {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Verifica STRIPE_SECRET_KEY en las variables de entorno.');
  }

  const plan = await storage.getSubscriptionPlan(planId);
  if (!plan) {
    throw new Error(`Plan no encontrado: ${planId}`);
  }

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  const returnUrl = `${baseUrl}/checkout-return?session_id={CHECKOUT_SESSION_ID}`;

  const trialDays = plan.trialDays && plan.trialDays > 0 ? plan.trialDays : 14;
  const isSubscription = plan.billingInterval !== 'trial' && plan.price > 0;
  const isTrialPlan = (plan.billingInterval === 'trial' || plan.price === 0) && trialDays > 0;

  // Trial plan (Prueba Gratis): suscripción con trial que pide email + tarjeta desde el inicio (como The Rundown)
  if (isTrialPlan) {
    const afterTrialPlan = await storage.getSubscriptionPlanByName('MENSUAL');
    if (!afterTrialPlan) {
      throw new Error('Plan MENSUAL no encontrado. Necesario para cobrar después del trial.');
    }
    const price = await stripe.prices.create({
      currency: (afterTrialPlan.currency || 'usd').toLowerCase(),
      unit_amount: afterTrialPlan.price,
      recurring: {
        interval: afterTrialPlan.billingInterval === 'year' ? 'year' : 'month',
      },
      product_data: {
        name: plan.displayName,
      },
    });

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      return_url: returnUrl,
      payment_method_collection: 'always',
      metadata: {
        planId: planId,
        planName: plan.name,
        guest: '1',
      },
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          planId: planId,
          planName: plan.name,
          guest: '1',
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: false },
    });

    return {
      clientSecret: session.client_secret!,
      sessionId: session.id,
    };
  }

  if (isSubscription) {
    const price = await stripe.prices.create({
      currency: (plan.currency || 'usd').toLowerCase(),
      unit_amount: plan.price,
      recurring: {
        interval: plan.billingInterval === 'year' ? 'year' : 'month',
      },
      product_data: {
        name: plan.displayName,
      },
    });

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      return_url: returnUrl,
      payment_method_collection: 'always',
      metadata: {
        planId: planId,
        planName: plan.name,
        guest: '1',
      },
      subscription_data: {
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        metadata: {
          planId: planId,
          planName: plan.name,
          guest: '1',
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: false },
    });

    return {
      clientSecret: session.client_secret!,
      sessionId: session.id,
    };
  }

  // Pago único $0 (solo si no es trial con tarjeta)
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    mode: 'payment',
    customer_creation: 'always',
    line_items: [
      {
        price_data: {
          currency: (plan.currency || 'usd').toLowerCase(),
          unit_amount: plan.price,
          product_data: {
            name: plan.displayName,
            description: `Plan ${plan.displayName}`,
          },
        },
        quantity: 1,
      },
    ],
    return_url: returnUrl,
    metadata: {
      planId: planId,
      planName: plan.name,
      guest: '1',
    },
  });

  return {
    clientSecret: session.client_secret!,
    sessionId: session.id,
  };
}

/**
 * Trial SetupIntent SIN customer: para mostrar email + tarjeta en una sola pantalla desde el inicio.
 * El cliente se crea después al confirmar, con createTrialSubscriptionWithPaymentMethodId.
 */
export async function createTrialSetupIntentGuest(planId: string): Promise<{ clientSecret: string }> {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Verifica STRIPE_SECRET_KEY en las variables de entorno.');
  }
  const plan = await storage.getSubscriptionPlan(planId);
  if (!plan) {
    throw new Error(`Plan no encontrado: ${planId}`);
  }
  const setupIntent = await stripe.setupIntents.create({
    payment_method_types: ['card'],
    usage: 'off_session',
    metadata: { planId, planName: plan.name, guest: '1' },
  });
  return { clientSecret: setupIntent.client_secret! };
}

/**
 * Trial con Payment Element: crea Customer + SetupIntent (flujo antiguo por email primero).
 */
export async function createTrialSetupIntent(
  email: string,
  planId: string
): Promise<{ clientSecret: string; customerId: string }> {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Verifica STRIPE_SECRET_KEY en las variables de entorno.');
  }
  const plan = await storage.getSubscriptionPlan(planId);
  if (!plan) {
    throw new Error(`Plan no encontrado: ${planId}`);
  }
  const customer = await stripe.customers.create({
    email: email.trim().toLowerCase(),
    metadata: { planId, planName: plan.name, guest: '1' },
  });
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ['card'],
    usage: 'off_session',
    metadata: { planId, planName: plan.name, guest: '1' },
  });
  return {
    clientSecret: setupIntent.client_secret!,
    customerId: customer.id,
  };
}

/**
 * Tras confirmar el SetupIntent en el front, crea la suscripción con trial y registra usuario/suscripción en nuestra BD.
 */
export async function createTrialSubscriptionWithPaymentMethod(
  customerId: string,
  planId: string,
  email: string
): Promise<{ subscriptionId: string }> {
  if (!stripe) {
    throw new Error('Stripe no está configurado.');
  }
  const plan = await storage.getSubscriptionPlan(planId);
  if (!plan) {
    throw new Error(`Plan no encontrado: ${planId}`);
  }
  const afterTrialPlan = await storage.getSubscriptionPlanByName('MENSUAL');
  if (!afterTrialPlan) {
    throw new Error('Plan MENSUAL no encontrado.');
  }
  const trialDays = plan.trialDays && plan.trialDays > 0 ? plan.trialDays : 14;
  const price = await stripe.prices.create({
    currency: (afterTrialPlan.currency || 'usd').toLowerCase(),
    unit_amount: afterTrialPlan.price,
    recurring: { interval: 'month' },
    product_data: { name: plan.displayName },
  });
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    trial_period_days: trialDays,
    payment_settings: { save_default_payment_method: 'on_subscription' },
    metadata: { planId, planName: plan.name, guest: '1' },
  });
  const normalizedEmail = email.trim().toLowerCase();
  let user = await storage.getUserByEmail(normalizedEmail);
  if (!user) {
    const crypto = await import('crypto');
    const randomPassword = crypto.randomBytes(24).toString('base64');
    let hashedPassword: string;
    try {
      const bcrypt = await import('bcrypt');
      const bcryptModule = (bcrypt as any).default || bcrypt;
      hashedPassword = await bcryptModule.hash(randomPassword, 10);
    } catch {
      hashedPassword = Buffer.from(randomPassword).toString('base64');
    }
    user = await storage.createUser({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: '',
      lastName: '',
      provider: 'email',
      isEmailVerified: true,
    });
  }
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  await storage.createUserSubscription({
    userId: user.id,
    planId: planId,
    status: 'active',
    startDate: new Date(),
    endDate,
    trialEndsAt,
    metadata: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
    },
  });
  await storage.createPurchase({
    userId: user.id,
    productType: 'plan',
    productId: planId,
    amount: plan.price,
    currency: plan.currency.toLowerCase(),
    stripeCustomerId: customerId,
    status: 'completed',
    metadata: { planName: plan.name, trial: '1' },
  });
  return { subscriptionId: subscription.id };
}

/**
 * Trial con paymentMethodId (tras confirmar SetupIntent sin customer).
 * Crea customer con email, adjunta el payment method y crea la suscripción con trial.
 */
export async function createTrialSubscriptionWithPaymentMethodId(
  paymentMethodId: string,
  planId: string,
  email: string
): Promise<{ subscriptionId: string }> {
  if (!stripe) {
    throw new Error('Stripe no está configurado.');
  }
  const plan = await storage.getSubscriptionPlan(planId);
  if (!plan) {
    throw new Error(`Plan no encontrado: ${planId}`);
  }
  const afterTrialPlan = await storage.getSubscriptionPlanByName('MENSUAL');
  if (!afterTrialPlan) {
    throw new Error('Plan MENSUAL no encontrado.');
  }
  const normalizedEmail = email.trim().toLowerCase();
  const customer = await stripe.customers.create({
    email: normalizedEmail,
    metadata: { planId, planName: plan.name, guest: '1' },
  });
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
  const trialDays = plan.trialDays && plan.trialDays > 0 ? plan.trialDays : 14;
  const price = await stripe.prices.create({
    currency: (afterTrialPlan.currency || 'usd').toLowerCase(),
    unit_amount: afterTrialPlan.price,
    recurring: { interval: 'month' },
    product_data: { name: plan.displayName },
  });
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    trial_period_days: trialDays,
    payment_settings: { save_default_payment_method: 'on_subscription' },
    metadata: { planId, planName: plan.name, guest: '1' },
  });
  let user = await storage.getUserByEmail(normalizedEmail);
  if (!user) {
    const crypto = await import('crypto');
    const randomPassword = crypto.randomBytes(24).toString('base64');
    let hashedPassword: string;
    try {
      const bcrypt = await import('bcrypt');
      const bcryptModule = (bcrypt as any).default || bcrypt;
      hashedPassword = await bcryptModule.hash(randomPassword, 10);
    } catch {
      hashedPassword = Buffer.from(randomPassword).toString('base64');
    }
    user = await storage.createUser({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: '',
      lastName: '',
      provider: 'email',
      isEmailVerified: true,
    });
  }
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  await storage.createUserSubscription({
    userId: user.id,
    planId: planId,
    status: 'active',
    startDate: new Date(),
    endDate,
    trialEndsAt,
    metadata: {
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
    },
  });
  await storage.createPurchase({
    userId: user.id,
    productType: 'plan',
    productId: planId,
    amount: plan.price,
    currency: plan.currency.toLowerCase(),
    stripeCustomerId: customer.id,
    status: 'completed',
    metadata: { planName: plan.name, trial: '1' },
  });
  return { subscriptionId: subscription.id };
}

/**
 * Tras redirección de Stripe (3DS): recupera el payment_method del SetupIntent y crea la suscripción trial.
 */
export async function createTrialSubscriptionFromSetupIntentId(
  setupIntentId: string,
  planId: string,
  email: string
): Promise<{ subscriptionId: string }> {
  if (!stripe) {
    throw new Error('Stripe no está configurado.');
  }
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
  const paymentMethodId = typeof setupIntent.payment_method === 'string'
    ? setupIntent.payment_method
    : setupIntent.payment_method?.id;
  if (!paymentMethodId) {
    throw new Error('No se encontró método de pago en el SetupIntent.');
  }
  return createTrialSubscriptionWithPaymentMethodId(paymentMethodId, planId, email);
}

/**
 * Create a Stripe Checkout Session for subscription (Legacy - Hosted)
 * Mantener por compatibilidad
 */
export async function createCheckoutSession(
  userId: string,
  planId: string,
  userEmail: string
): Promise<{ sessionId: string; url: string }> {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Verifica STRIPE_SECRET_KEY en las variables de entorno.');
  }

  const plan = await storage.getSubscriptionPlan(planId);
  if (!plan) {
    throw new Error(`Plan no encontrado: ${planId}`);
  }

  const isSubscription = plan.billingInterval !== 'trial' && plan.price > 0;
  
  let customerId: string;
  const existingSubscription = await storage.getUserActiveSubscription(userId);
  
  const metadata = existingSubscription?.metadata as Record<string, any> | undefined;
  if (metadata?.stripeCustomerId) {
    customerId = metadata.stripeCustomerId as string;
  } else {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId: userId },
    });
    customerId = customer.id;
  }

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  const successUrl = `${baseUrl}/planes?success=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/planes?canceled=true`;

  const price = await stripe.prices.create({
    currency: plan.currency.toLowerCase(),
    unit_amount: plan.price,
    recurring: isSubscription ? {
      interval: plan.billingInterval === 'year' ? 'year' : 'month',
    } : undefined,
    product_data: {
      name: plan.displayName,
    },
  });

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: isSubscription ? 'subscription' : 'payment',
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, planId, planName: plan.name },
    allow_promotion_codes: true,
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe no está configurado');
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancelled(subscription);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentSucceeded(invoice);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentFailed(invoice);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Handle successful checkout (incl. guest checkout: crear/buscar usuario por email)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const planId = session.metadata?.planId;
  const planName = session.metadata?.planName;
  const isGuest = session.metadata?.guest === '1';

  if (!planId || !planName) {
    console.error('❌ Missing metadata in checkout session:', session.id);
    return;
  }

  let userId: string | undefined = session.metadata?.userId as string | undefined;

  if (isGuest || !userId) {
    const email = (session.customer_details as any)?.email || (session as any).customer_email;
    if (!email) {
      console.error('❌ Guest checkout: no email in session', session.id);
      return;
    }
    let user = await storage.getUserByEmail(email);
    if (!user) {
      const crypto = await import('crypto');
      const randomPassword = crypto.randomBytes(24).toString('base64');
      let hashedPassword: string;
      try {
        const bcrypt = await import('bcrypt');
        const bcryptModule = (bcrypt as any).default || bcrypt;
        hashedPassword = await bcryptModule.hash(randomPassword, 10);
      } catch {
        hashedPassword = Buffer.from(randomPassword).toString('base64');
      }
      user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: '',
        lastName: '',
        provider: 'email',
        isEmailVerified: true,
      });
      console.log('✅ Guest checkout: usuario creado por email', user.id);
    }
    userId = user.id;
  }

  const customerId = session.customer as string;

  // Get plan details
  const plan = await storage.getSubscriptionPlan(planId);
  if (!plan) {
    console.error(`❌ Plan not found: ${planId}`);
    return;
  }

  // Calculate end date based on billing interval
  let endDate: Date | null = null;
  let trialEndsAt: Date | null = null;

  if (plan.trialDays && plan.trialDays > 0) {
    trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays);
  }

  if (plan.billingInterval === 'month') {
    endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (plan.billingInterval === 'year') {
    endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  // Cancel any existing active subscription
  const existingSubscription = await storage.getUserActiveSubscription(userId);
  if (existingSubscription && existingSubscription.status === 'active') {
    await storage.updateUserSubscription(existingSubscription.id, {
      status: 'cancelled',
      cancelledAt: new Date(),
    });
  }

  // Create new subscription
  await storage.createUserSubscription({
    userId: userId,
    planId: planId,
    status: 'active',
    startDate: new Date(),
    endDate: endDate,
    trialEndsAt: trialEndsAt,
    metadata: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: session.subscription as string || null,
      stripeCheckoutSessionId: session.id,
    },
  });

  // Create purchase record
  await storage.createPurchase({
    userId: userId,
    productType: 'plan',
    productId: planId,
    amount: plan.price,
    currency: plan.currency.toLowerCase(),
    stripePaymentIntentId: session.payment_intent as string || null,
    stripeCustomerId: customerId,
    status: 'completed',
    metadata: {
      stripeSessionId: session.id,
      planName: planName,
    },
  });

  console.log(`✅ Subscription created for user ${userId}, plan: ${planName}`);
  
  // Record subscription_created event
  try {
    const { recordEvent } = await import('./eventSystem');
    const stripeSubscription = await stripe?.subscriptions.retrieve(session.subscription as string);
    if (stripeSubscription) {
      await recordEvent(userId, 'subscription_created', {
        subscriptionId: stripeSubscription.id,
        planId: planId || undefined,
        planName,
        status: stripeSubscription.status,
      });
    }
  } catch (error: any) {
    console.error('Error recording subscription_created event:', error.message);
  }
}

/**
 * Handle subscription update (renewal, plan change, etc.)
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('❌ Missing userId in subscription metadata');
    return;
  }

  const planId = subscription.metadata?.planId;
  if (!planId) {
    console.error('❌ Missing planId in subscription metadata');
    return;
  }

  // Find existing subscription by Stripe subscription ID
  const existingSubscription = await storage.getUserActiveSubscription(userId);
  
  if (existingSubscription) {
    // Update existing subscription
    const currentPeriodEnd = (subscription as any).current_period_end;
    const endDate = currentPeriodEnd 
      ? new Date(currentPeriodEnd * 1000)
      : null;

    const existingMetadata = (existingSubscription.metadata as Record<string, any>) || {};
    await storage.updateUserSubscription(existingSubscription.id, {
      status: subscription.status === 'active' ? 'active' : 'cancelled',
      endDate: endDate,
      metadata: {
        ...existingMetadata,
        stripeSubscriptionId: subscription.id,
        stripeStatus: subscription.status,
      },
    });

    console.log(`✅ Subscription updated for user ${userId}, status: ${subscription.status}`);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('❌ Missing userId in subscription metadata');
    return;
  }

  const existingSubscription = await storage.getUserActiveSubscription(userId);
  if (existingSubscription) {
    await storage.cancelUserSubscription(userId);
    console.log(`✅ Subscription cancelled for user ${userId}`);
    
    // Record subscription_cancelled event
    try {
      const { recordEvent } = await import('./eventSystem');
      await recordEvent(userId, 'subscription_cancelled', {
        subscriptionId: subscription.id,
        cancelledAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error recording subscription_cancelled event:', error.message);
    }
  }
}

/**
 * Handle successful invoice payment (renewal)
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  // Get subscription from Stripe to get metadata
  if (!stripe) return;
  
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    console.error('❌ Missing userId in subscription metadata');
    return;
  }

  const existingSubscription = await storage.getUserActiveSubscription(userId);
  if (existingSubscription) {
    // Update end date for renewal
    const currentPeriodEnd = (subscription as any).current_period_end;
    const endDate = currentPeriodEnd 
      ? new Date(currentPeriodEnd * 1000)
      : null;

    await storage.updateUserSubscription(existingSubscription.id, {
      endDate: endDate,
      status: 'active',
    });

    console.log(`✅ Subscription renewed for user ${userId}`);
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  if (!stripe) return;
  
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    console.error('❌ Missing userId in subscription metadata');
    return;
  }

  const existingSubscription = await storage.getUserActiveSubscription(userId);
  if (existingSubscription) {
    // Mark subscription as past_due or cancelled based on Stripe status
    const existingMetadata = (existingSubscription.metadata as Record<string, any>) || {};
    await storage.updateUserSubscription(existingSubscription.id, {
      status: subscription.status === 'past_due' ? 'active' : 'cancelled', // Keep active but track payment issue
      metadata: {
        ...existingMetadata,
        lastPaymentFailed: true,
        lastPaymentFailedAt: new Date().toISOString(),
      },
    });

    console.log(`⚠️ Payment failed for user ${userId}`);
  }
}

