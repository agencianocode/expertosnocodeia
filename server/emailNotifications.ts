import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

async function getUncachableResendClient() {
  const {apiKey, fromEmail} = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail || 'onboarding@resend.dev'
  };
}

interface NotifyNewCommentParams {
  commentId: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  authorName: string;
  commentContent: string;
  recipientEmails: string[];
  isReply?: boolean;
  parentAuthorEmail?: string;
}

export async function sendNewCommentNotification(params: NotifyNewCommentParams): Promise<void> {
  try {
    // Verify Resend is configured before proceeding
    if (!process.env.REPLIT_CONNECTORS_HOSTNAME && !process.env.RESEND_API_KEY) {
      console.warn('⚠️ Resend not configured, skipping email notification');
      return;
    }

    const { client, fromEmail } = await getUncachableResendClient();
    
    const subject = params.isReply 
      ? `Nueva respuesta en "${params.lessonTitle}"`
      : `Nuevo comentario en "${params.lessonTitle}"`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .comment-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
            .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">${subject}</h1>
            </div>
            <div class="content">
              <p><strong>${params.authorName}</strong> ${params.isReply ? 'respondió' : 'comentó'} en la lección <strong>${params.lessonTitle}</strong> del curso <strong>${params.courseTitle}</strong>:</p>
              
              <div class="comment-box">
                <p>${params.commentContent}</p>
              </div>

              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/lesson/${params.lessonId}#comments" class="btn">
                Ver comentario
              </a>

              <div class="footer">
                <p>Recibes este email porque eres parte de la comunidad Expertos NoCode IA</p>
                <p style="font-size: 12px; color: #9ca3af;">Expertos NoCode IA - Aprende a crear sin código</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
${subject}

${params.authorName} ${params.isReply ? 'respondió' : 'comentó'} en la lección "${params.lessonTitle}" del curso "${params.courseTitle}":

"${params.commentContent}"

Ver comentario: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/lesson/${params.lessonId}#comments

---
Expertos NoCode IA - Aprende a crear sin código
    `;

    // Send to admins or specific recipients (fire-and-forget, don't await)
    const emailPromises = params.recipientEmails.map(email => 
      client.emails.send({
        from: fromEmail,
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent,
      }).catch(err => {
        console.error(`❌ Failed to send email to ${email}:`, err);
        return null; // Don't propagate individual failures
      })
    );

    // Wait for all emails (but don't fail if some don't send)
    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`✅ Sent ${successCount}/${params.recipientEmails.length} notification emails for comment ${params.commentId}`);
  } catch (error) {
    // Log but don't throw - email failures shouldn't break the API
    console.error('❌ Failed to send comment notification emails:', error);
  }
}

export async function getAdminNotificationEmails(): Promise<string[]> {
  // For now, return a hardcoded list of admin emails
  // In production, this should query the database for admin users
  const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.split(',') || [];
  return adminEmails.filter(email => email.trim().length > 0);
}

interface EventConfirmationParams {
  email: string;
  firstName: string;
  eventTitle: string;
  eventDate: Date | string;
  eventTime: Date | string;
  hostName: string;
  joinUrl: string;
}

export async function sendEventConfirmationEmail(params: EventConfirmationParams): Promise<void> {
  try {
    if (!process.env.REPLIT_CONNECTORS_HOSTNAME && !process.env.RESEND_API_KEY) {
      console.warn('⚠️ Resend not configured, skipping event confirmation email');
      return;
    }

    const { client, fromEmail } = await getUncachableResendClient();
    
    const eventDate = new Date(params.eventDate);
    const eventTime = new Date(params.eventTime);
    const formattedDate = eventDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = eventTime.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 40px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .event-box { background: white; padding: 25px; border-left: 4px solid #06b6d4; margin: 20px 0; border-radius: 4px; }
            .btn { display: inline-block; padding: 14px 28px; background: #06b6d4; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            .info-row { margin: 10px 0; }
            .info-label { font-weight: 600; color: #374151; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">✅ ¡Registro Confirmado!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Estás registrado para el evento</p>
            </div>
            <div class="content">
              <p>Hola <strong>${params.firstName}</strong>,</p>
              
              <p>Tu registro para el siguiente evento ha sido confirmado:</p>
              
              <div class="event-box">
                <h2 style="margin-top: 0; color: #1f2937;">${params.eventTitle}</h2>
                <div class="info-row">
                  <span class="info-label">📅 Fecha:</span> ${formattedDate}
                </div>
                <div class="info-row">
                  <span class="info-label">🕐 Hora:</span> ${formattedTime}
                </div>
                <div class="info-row">
                  <span class="info-label">👤 Anfitrión:</span> ${params.hostName}
                </div>
              </div>

              <p>Te enviaremos un recordatorio 24 horas antes del evento y otro 1 hora antes.</p>

              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}${params.joinUrl}" class="btn">
                Ver Detalles del Evento
              </a>

              <div class="footer">
                <p>Recibes este email porque te registraste para este evento en Expertos NoCode IA</p>
                <p style="font-size: 12px; color: #9ca3af;">Expertos NoCode IA - Comunidad de aprendizaje</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: params.email,
      subject: `✅ Registro confirmado: ${params.eventTitle}`,
      html: htmlContent,
    });

    console.log(`✅ Event confirmation email sent to ${params.email}`);
  } catch (error) {
    console.error('❌ Failed to send event confirmation email:', error);
  }
}

interface EventReminderParams {
  email: string;
  firstName: string;
  eventTitle: string;
  eventDate: Date | string;
  eventTime: Date | string;
  hostName: string;
  joinUrl: string;
  reminderType: '24h' | '1h';
}

export async function sendEventReminderEmail(params: EventReminderParams): Promise<void> {
  try {
    if (!process.env.REPLIT_CONNECTORS_HOSTNAME && !process.env.RESEND_API_KEY) {
      console.warn('⚠️ Resend not configured, skipping event reminder email');
      return;
    }

    const { client, fromEmail } = await getUncachableResendClient();
    
    const eventDate = new Date(params.eventDate);
    const eventTime = new Date(params.eventTime);
    const formattedDate = eventDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = eventTime.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const reminderText = params.reminderType === '24h' 
      ? 'El evento es mañana' 
      : 'El evento comienza en 1 hora';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 40px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .event-box { background: white; padding: 25px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
            .btn { display: inline-block; padding: 14px 28px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            .info-row { margin: 10px 0; }
            .info-label { font-weight: 600; color: #374151; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">⏰ Recordatorio de Evento</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${reminderText}</p>
            </div>
            <div class="content">
              <p>Hola <strong>${params.firstName}</strong>,</p>
              
              <p>Este es un recordatorio de que estás registrado para:</p>
              
              <div class="event-box">
                <h2 style="margin-top: 0; color: #1f2937;">${params.eventTitle}</h2>
                <div class="info-row">
                  <span class="info-label">📅 Fecha:</span> ${formattedDate}
                </div>
                <div class="info-row">
                  <span class="info-label">🕐 Hora:</span> ${formattedTime}
                </div>
                <div class="info-row">
                  <span class="info-label">👤 Anfitrión:</span> ${params.hostName}
                </div>
              </div>

              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}${params.joinUrl}" class="btn">
                Unirse al Evento
              </a>

              <div class="footer">
                <p>Recibes este email porque te registraste para este evento en Expertos NoCode IA</p>
                <p style="font-size: 12px; color: #9ca3af;">Expertos NoCode IA - Comunidad de aprendizaje</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: params.email,
      subject: `⏰ Recordatorio: ${params.eventTitle} ${params.reminderType === '24h' ? 'mañana' : 'en 1 hora'}`,
      html: htmlContent,
    });

    console.log(`✅ Event reminder email sent to ${params.email} (${params.reminderType})`);
  } catch (error) {
    console.error('❌ Failed to send event reminder email:', error);
  }
}

// ============================================
// WHATSAPP NOTIFICATIONS (Future Integration)
// ============================================

interface WhatsAppNotificationParams {
  phone: string;
  firstName: string;
  eventTitle: string;
  eventDate: Date | string;
  eventTime: Date | string;
  joinUrl: string;
  notificationType: 'confirmation' | 'reminder24h' | 'reminder1h';
}

export async function sendWhatsAppNotification(params: WhatsAppNotificationParams): Promise<void> {
  try {
    // Check if WhatsApp is configured
    const whatsappApiKey = process.env.WHATSAPP_API_KEY;
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;
    
    if (!whatsappApiKey || !whatsappPhoneId) {
      console.warn('⚠️ WhatsApp Business API not configured, skipping WhatsApp notification');
      return;
    }

    // Format phone number (remove + and spaces)
    const phoneNumber = params.phone.replace(/[+\s]/g, '');
    
    const eventDate = new Date(params.eventDate);
    const eventTime = new Date(params.eventTime);
    const formattedDate = eventDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = eventTime.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    let message = '';
    if (params.notificationType === 'confirmation') {
      message = `✅ *Registro Confirmado*\n\nHola ${params.firstName}, tu registro para el evento *${params.eventTitle}* ha sido confirmado.\n\n📅 Fecha: ${formattedDate}\n🕐 Hora: ${formattedTime}\n\nTe enviaremos recordatorios antes del evento.\n\nVer detalles: ${process.env.FRONTEND_URL || 'http://localhost:5000'}${params.joinUrl}`;
    } else if (params.notificationType === 'reminder24h') {
      message = `⏰ *Recordatorio de Evento*\n\nHola ${params.firstName}, este es un recordatorio de que el evento *${params.eventTitle}* es mañana.\n\n📅 Fecha: ${formattedDate}\n🕐 Hora: ${formattedTime}\n\nUnirse: ${process.env.FRONTEND_URL || 'http://localhost:5000'}${params.joinUrl}`;
    } else if (params.notificationType === 'reminder1h') {
      message = `⏰ *Recordatorio de Evento*\n\nHola ${params.firstName}, el evento *${params.eventTitle}* comienza en 1 hora.\n\n📅 Fecha: ${formattedDate}\n🕐 Hora: ${formattedTime}\n\nUnirse ahora: ${process.env.FRONTEND_URL || 'http://localhost:5000'}${params.joinUrl}`;
    }

    // TODO: Integrate with WhatsApp Business API
    // Example using Twilio or WhatsApp Cloud API:
    /*
    const response = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message }
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }
    */

    console.log(`📱 WhatsApp notification prepared for ${phoneNumber} (${params.notificationType})`);
    console.log('💡 To enable WhatsApp, configure WHATSAPP_API_KEY and WHATSAPP_PHONE_ID environment variables');
  } catch (error) {
    console.error('❌ Failed to send WhatsApp notification:', error);
  }
}
