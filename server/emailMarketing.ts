import { Resend } from 'resend';
import { storage } from './storage';

// Helper to get Resend client
async function getResendClient() {
  // Try direct API key first (for local/production)
  if (process.env.RESEND_API_KEY) {
    return {
      client: new Resend(process.env.RESEND_API_KEY),
      fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@expertosnocodeia.com',
    };
  }

  // Fallback to Replit connector (if exists)
  if (process.env.REPLIT_CONNECTORS_HOSTNAME) {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (xReplitToken) {
      const connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      ).then(res => res.json()).then(data => data.items?.[0]);

      if (connectionSettings?.settings?.api_key) {
        return {
          client: new Resend(connectionSettings.settings.api_key),
          fromEmail: connectionSettings.settings.from_email || 'onboarding@resend.dev',
        };
      }
    }
  }

  throw new Error('Resend no está configurado. Agrega RESEND_API_KEY a las variables de entorno.');
}

// Email template base
function getEmailTemplate(content: string, title: string, ctaText?: string, ctaUrl?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: 600;
    }
    .content { 
      padding: 40px 30px; 
      color: #374151;
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
    }
    .btn { 
      display: inline-block; 
      padding: 14px 28px; 
      background: #667eea; 
      color: white; 
      text-decoration: none; 
      border-radius: 6px; 
      margin: 24px 0;
      font-weight: 600;
      font-size: 16px;
    }
    .footer { 
      text-align: center; 
      color: #6b7280; 
      font-size: 14px; 
      padding: 30px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
      ${ctaText && ctaUrl ? `<a href="${ctaUrl}" class="btn">${ctaText}</a>` : ''}
    </div>
    <div class="footer">
      <p><strong>Expertos NoCode IA</strong></p>
      <p>Universidad de NoCode e IA</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
        Si no deseas recibir estos emails, puedes <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/profile" style="color: #667eea;">actualizar tus preferencias</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Send email helper
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    
    const result = await client.emails.send({
      from: params.from || fromEmail,
      to: recipients,
      subject: params.subject,
      html: params.html,
    });

    if (result.error) {
      console.error('❌ Error enviando email:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('✅ Email enviado exitosamente a:', recipients.join(', '));
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// AUTOMATED EMAIL SEQUENCES
// ============================================

/**
 * Welcome email - sent when user registers
 */
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
  const content = `
    <p>¡Hola <strong>${userName}</strong>!</p>
    <p>¡Bienvenido a <strong>Expertos NoCode IA</strong>! 🎉</p>
    <p>Estamos emocionados de tenerte aquí. Ahora tienes acceso a:</p>
    <ul style="margin: 20px 0; padding-left: 20px;">
      <li>Cursos completos de NoCode e IA</li>
      <li>Guías paso a paso diarias</li>
      <li>Workshops en vivo semanales</li>
      <li>Comunidad privada de expertos</li>
    </ul>
    <p>¡Comienza tu viaje ahora mismo!</p>
  `;

  await sendEmail({
    to: userEmail,
    subject: '¡Bienvenido a Expertos NoCode IA! 🚀',
    html: getEmailTemplate(
      content,
      '¡Bienvenido!',
      'Explorar Cursos',
      `${process.env.FRONTEND_URL || 'http://localhost:5000'}/courses`
    ),
  });
}

/**
 * Trial reminder emails - sent on day 7, 12, and 14
 */
export async function sendTrialReminderEmail(
  userEmail: string, 
  userName: string, 
  daysRemaining: number
): Promise<void> {
  const urgency = daysRemaining <= 2 ? 'alta' : daysRemaining <= 5 ? 'media' : 'baja';
  
  let content = '';
  let title = '';
  
  if (daysRemaining === 7) {
    title = '⏰ Tu trial termina en 7 días';
    content = `
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Tu periodo de prueba termina en <strong>7 días</strong>.</p>
      <p>¿Quieres continuar aprendiendo sin límites? Suscríbete ahora y mantén tu acceso completo a todos nuestros recursos.</p>
      <p><strong>Oferta especial:</strong> Ahorra 2 meses con el plan anual.</p>
    `;
  } else if (daysRemaining === 2) {
    title = '⚠️ Tu trial termina en 2 días';
    content = `
      <p>Hola <strong>${userName}</strong>,</p>
      <p><strong>¡Última oportunidad!</strong> Tu periodo de prueba termina en solo 2 días.</p>
      <p>No pierdas acceso a todos los cursos, guías y workshops. Suscríbete ahora con un <strong>descuento especial del 20%</strong>.</p>
    `;
  } else if (daysRemaining === 0) {
    title = '🔔 Tu trial ha terminado';
    content = `
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Tu periodo de prueba ha terminado, pero aún puedes suscribirte para mantener tu acceso.</p>
      <p>Te ofrecemos un <strong>descuento especial del 25%</strong> si te suscribes hoy.</p>
    `;
  } else {
    title = `⏰ Tu trial termina en ${daysRemaining} días`;
    content = `
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Tu periodo de prueba termina en <strong>${daysRemaining} días</strong>.</p>
      <p>Suscríbete ahora para mantener tu acceso completo a todos nuestros recursos.</p>
    `;
  }

  await sendEmail({
    to: userEmail,
    subject: title,
    html: getEmailTemplate(
      content,
      title,
      'Ver Planes',
      `${process.env.FRONTEND_URL || 'http://localhost:5000'}/planes`
    ),
  });
}

/**
 * Onboarding sequence emails (5 emails)
 */
export async function sendOnboardingEmail(
  userEmail: string,
  userName: string,
  emailNumber: number
): Promise<void> {
  const emails = [
    {
      subject: '🎯 Primeros pasos en Expertos NoCode IA',
      title: '¡Comienza tu viaje!',
      content: `
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Te damos la bienvenida. Aquí tienes 3 acciones para empezar:</p>
        <ol style="margin: 20px 0; padding-left: 20px;">
          <li>Completa tu perfil para personalizar tu experiencia</li>
          <li>Explora nuestros cursos más populares</li>
          <li>Únete a la comunidad y haz tu primera pregunta</li>
        </ol>
      `,
      cta: 'Completar Perfil',
      url: '/onboarding',
    },
    {
      subject: '📚 Descubre nuestros cursos más populares',
      title: 'Cursos recomendados para ti',
      content: `
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Basado en tu perfil, estos cursos son perfectos para ti:</p>
        <ul style="margin: 20px 0; padding-left: 20px;">
          <li>Introducción a NoCode</li>
          <li>Automatización con IA</li>
          <li>Creación de SaaS sin código</li>
        </ul>
      `,
      cta: 'Ver Cursos',
      url: '/courses',
    },
    {
      subject: '💡 Tips para aprovechar al máximo la plataforma',
      title: 'Tips Pro',
      content: `
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Aquí tienes algunos consejos para aprovechar al máximo:</p>
        <ul style="margin: 20px 0; padding-left: 20px;">
          <li>Guarda tus cursos favoritos para acceso rápido</li>
          <li>Participa en workshops en vivo cada semana</li>
          <li>Haz preguntas en la comunidad - siempre respondemos</li>
        </ul>
      `,
      cta: 'Explorar',
      url: '/dashboard',
    },
    {
      subject: '🎓 Certifícate y muestra tus logros',
      title: 'Obtén certificados',
      content: `
        <p>Hola <strong>${userName}</strong>,</p>
        <p>¿Sabías que puedes obtener certificados al completar cursos?</p>
        <p>Los certificados son una excelente forma de demostrar tus habilidades y agregarlos a tu perfil profesional.</p>
      `,
      cta: 'Ver Mis Certificados',
      url: '/profile',
    },
    {
      subject: '🚀 Únete a la comunidad de expertos',
      title: 'Conecta con otros',
      content: `
        <p>Hola <strong>${userName}</strong>,</p>
        <p>La comunidad es el corazón de Expertos NoCode IA.</p>
        <p>Únete a las conversaciones, comparte tus proyectos y aprende de otros miembros.</p>
      `,
      cta: 'Ir a Comunidad',
      url: '/community',
    },
  ];

  const email = emails[emailNumber - 1];
  if (!email) return;

  await sendEmail({
    to: userEmail,
    subject: email.subject,
    html: getEmailTemplate(
      email.content,
      email.title,
      email.cta,
      `${process.env.FRONTEND_URL || 'http://localhost:5000'}${email.url}`
    ),
  });
}

/**
 * Subscription cancellation recovery email
 */
export async function sendCancellationRecoveryEmail(
  userEmail: string,
  userName: string
): Promise<void> {
  const content = `
    <p>Hola <strong>${userName}</strong>,</p>
    <p>Lamentamos verte partir. 😢</p>
    <p>Antes de que te vayas, queremos ofrecerte un <strong>descuento especial del 30%</strong> para que regreses.</p>
    <p>Tu progreso y contenido guardado seguirán aquí cuando regreses.</p>
    <p>¿Qué te hizo cancelar? Nos encantaría escuchar tu feedback para mejorar.</p>
  `;

  await sendEmail({
    to: userEmail,
    subject: '¿Cambiamos tu decisión? Oferta especial para ti',
    html: getEmailTemplate(
      content,
      'Esperamos verte de nuevo',
      'Ver Oferta',
      `${process.env.FRONTEND_URL || 'http://localhost:5000'}/planes?discount=30`
    ),
  });
}

/**
 * Password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const content = `
    <p>Hola <strong>${userName}</strong>,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
    <p>Si solicitaste este cambio, haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expirará en 1 hora.</p>
    <p>Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
  `;

  await sendEmail({
    to: userEmail,
    subject: 'Restablece tu contraseña - Expertos NoCode IA',
    html: getEmailTemplate(
      content,
      'Restablecer contraseña',
      'Restablecer contraseña',
      resetUrl
    ),
  });
}

/**
 * Password change notification email
 */
export async function sendPasswordChangeNotificationEmail(
  userEmail: string,
  userName: string
): Promise<void> {
  const content = `
    <p>Hola <strong>${userName}</strong>,</p>
    <p>Tu contraseña ha sido cambiada exitosamente.</p>
    <p>Si no realizaste este cambio, por favor contacta a nuestro equipo de soporte inmediatamente.</p>
    <p>Para tu seguridad, si no reconoces este cambio, te recomendamos:</p>
    <ul style="margin: 20px 0; padding-left: 20px;">
      <li>Cambiar tu contraseña nuevamente</li>
      <li>Revisar la actividad reciente de tu cuenta</li>
      <li>Contactar a soporte si detectas actividad sospechosa</li>
    </ul>
  `;

  await sendEmail({
    to: userEmail,
    subject: 'Tu contraseña ha sido cambiada - Expertos NoCode IA',
    html: getEmailTemplate(
      content,
      'Contraseña actualizada',
      'Ir a mi perfil',
      `${process.env.FRONTEND_URL || 'http://localhost:5000'}/profile`
    ),
  });
}

/**
 * Email verification email
 */
export async function sendEmailVerificationEmail(
  userEmail: string,
  userName: string,
  verificationToken: string
): Promise<void> {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/verify-email?token=${verificationToken}`;
  
  const content = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">¡Bienvenido a Expertos NoCode IA!</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Estás a un paso de comenzar tu viaje</p>
      </div>
      
      <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hola <strong style="color: #667eea;">${userName}</strong>,</p>
        
        <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
          Gracias por unirte a nuestra comunidad. Para completar tu registro y acceder a todas las funcionalidades, necesitamos verificar tu dirección de correo electrónico.
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
            Verificar mi email
          </a>
        </div>
        
        <div style="background: #f3f4f6; border-left: 4px solid #667eea; padding: 15px 20px; margin: 30px 0; border-radius: 6px;">
          <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
            <strong style="color: #374151;">⏰ Importante:</strong> Este enlace expirará en <strong>24 horas</strong> por seguridad.
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0;">
          Si no creaste esta cuenta, puedes ignorar este email de forma segura. No se realizará ninguna acción.
        </p>
        
        <div style="border-top: 1px solid #e5e7eb; margin-top: 35px; padding-top: 25px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
            ¿Tienes problemas con el botón? Copia y pega este enlace en tu navegador:
          </p>
          <p style="color: #667eea; font-size: 12px; word-break: break-all; margin: 0;">
            ${verifyUrl}
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Expertos NoCode IA. Todos los derechos reservados.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
          Aprende a crear sin código
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: '✨ Verifica tu email - Expertos NoCode IA',
    html: content,
  });
}

/**
 * Re-engagement email for inactive users
 */
export async function sendReEngagementEmail(
  userEmail: string,
  userName: string,
  daysInactive: number
): Promise<void> {
  const content = `
    <p>Hola <strong>${userName}</strong>,</p>
    <p>Te extrañamos. Hace ${daysInactive} días que no te vemos por aquí.</p>
    <p>Tenemos contenido nuevo que te puede interesar:</p>
    <ul style="margin: 20px 0; padding-left: 20px;">
      <li>Nuevos cursos agregados esta semana</li>
      <li>Workshop especial este viernes</li>
      <li>Casos de éxito de otros miembros</li>
    </ul>
    <p>¡Vuelve y continúa tu aprendizaje!</p>
  `;

  await sendEmail({
    to: userEmail,
    subject: 'Te extrañamos - Tenemos algo nuevo para ti',
    html: getEmailTemplate(
      content,
      '¡Vuelve!',
      'Ver Novedades',
      `${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard`
    ),
  });
}

// ============================================
// MANUAL EMAIL SENDING
// ============================================

/**
 * Send email to all users or filtered segment
 */
export async function sendBulkEmail(params: {
  subject: string;
  content: string;
  segment?: 'all' | 'trial' | 'active' | 'cancelled' | 'none';
  userIds?: string[];
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  try {
    let targetUsers: Array<{ email: string; firstName: string | null }> = [];

    if (params.userIds && params.userIds.length > 0) {
      // Send to specific users
      for (const userId of params.userIds) {
        const user = await storage.getUser(userId);
        if (user && user.email) {
          targetUsers.push({ email: user.email, firstName: user.firstName });
        }
      }
    } else {
      // Get users based on segment
      const users = await storage.getAllUsers({
        limit: 10000, // Large limit to get all
        subscriptionStatus: params.segment === 'all' ? undefined : params.segment,
      });

      targetUsers = users
        .filter(u => u.email)
        .map(u => ({ email: u.email, firstName: u.firstName }));
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send emails in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < targetUsers.length; i += batchSize) {
      const batch = targetUsers.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (user) => {
          const userName = user.firstName || 'Usuario';
          const personalizedContent = params.content.replace(/\{\{name\}\}/g, userName);
          
          const result = await sendEmail({
            to: user.email,
            subject: params.subject,
            html: getEmailTemplate(
              personalizedContent,
              params.subject,
            ),
          });

          if (result.success) {
            sent++;
          } else {
            failed++;
            errors.push(`${user.email}: ${result.error}`);
          }
        })
      );

      // Small delay between batches to avoid rate limits
      if (i + batchSize < targetUsers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { sent, failed, errors };
  } catch (error: any) {
    console.error('❌ Error en envío masivo:', error);
    throw error;
  }
}

