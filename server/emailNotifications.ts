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

              <a href="${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/lesson/${params.lessonId}#comments" class="btn">
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

Ver comentario: ${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/lesson/${params.lessonId}#comments

---
Expertos NoCode IA - Aprende a crear sin código
    `;

    // Send to admins or specific recipients
    for (const email of params.recipientEmails) {
      await client.emails.send({
        from: fromEmail,
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent,
      });
    }

    console.log(`✅ Notification email sent for comment ${params.commentId} to ${params.recipientEmails.length} recipients`);
  } catch (error) {
    console.error('❌ Failed to send comment notification email:', error);
    throw error;
  }
}

export async function getAdminNotificationEmails(): Promise<string[]> {
  // For now, return a hardcoded list of admin emails
  // In production, this should query the database for admin users
  const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.split(',') || [];
  return adminEmails.filter(email => email.trim().length > 0);
}
