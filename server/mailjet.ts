/**
 * Mailjet Email Service
 * Handles all email delivery using Mailjet API
 */

interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  fromEmail?: string;
  fromName?: string;
}

/**
 * Send email using Mailjet API
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailjetApiKey = process.env.MAILJET_API_KEY;
    const mailjetSecretKey = process.env.MAILJET_SECRET_KEY;

    if (!mailjetApiKey || !mailjetSecretKey) {
      console.error('Mailjet API keys not configured');
      return false;
    }

    const fromEmail = options.fromEmail || process.env.FROM_EMAIL || 'noreply@debteraserpro.com';
    const fromName = options.fromName || 'Debt Eraser Pro';

    // Mailjet API v3.1 requires Basic Auth with API key and Secret key
    const auth = Buffer.from(`${mailjetApiKey}:${mailjetSecretKey}`).toString('base64');

    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: fromName
            },
            To: [
              {
                Email: options.to
              }
            ],
            Subject: options.subject,
            HTMLPart: options.htmlContent
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Mailjet API error:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('✅ Email sent successfully via Mailjet:', result);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email via Mailjet:', error);
    return false;
  }
}

/**
 * Send PDF stack email after quiz completion
 */
export async function sendPDFStackEmail(
  email: string,
  name: string,
  archetype: string,
  pdfStack: string,
  battlePlan: string
): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10b981;">Your Custom Debt Eraser Stack Is Ready!</h1>

      <p>Hey ${name || 'there'},</p>

      <p><strong>Your Financial Archetype:</strong> ${archetype}</p>

      <p><strong>Your Battle Plan:</strong></p>
      <p>${battlePlan}</p>

      <p><strong>Your Custom PDF Stack:</strong> ${pdfStack}</p>

      <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3>📥 Download Your Documents</h3>
        <p><a href="https://debteraserpro.com/pdfs/${pdfStack.replace(/\s/g, '-').toLowerCase()}.zip"
              style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
           Download PDF Stack
        </a></p>
      </div>

      <p><strong>Ready to take it further?</strong></p>
      <p>Join the Debt Eraser Pro community for $97/month and get:</p>
      <ul>
        <li>Access to ALL document templates</li>
        <li>Live Q&A sessions twice a month</li>
        <li>Private community support</li>
        <li>Unlimited access to War Room AI</li>
      </ul>

      <p><a href="https://debteraserpro.com"
            style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
         Join Fusion Community - $97
      </a></p>

      <p>To your financial freedom,<br>
      <strong>The Debt Eraser Team</strong></p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Your ${pdfStack} is Ready! 📄`,
    htmlContent
  });
}

/**
 * Send welcome email to new community member
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10b981;">Welcome to Debt Eraser Pro! 🎉</h1>

      <p>Hey ${name},</p>

      <p><strong>Your community access is now LIVE!</strong></p>

      <p>Here's what you can do right now:</p>
      <ul>
        <li>📱 Access the community feed and connect with members</li>
        <li>💬 Chat with the War Room AI for instant debt advice</li>
        <li>📅 View upcoming live Q&A sessions</li>
        <li>📥 Download ALL templates from The Vault</li>
      </ul>

      <p><a href="https://debteraserpro.com"
            style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
         Access Your Dashboard
      </a></p>

      <p><strong>Next Live Call:</strong> See the calendar in your dashboard</p>

      <p>To your financial freedom,<br>
      <strong>The Debt Eraser Team</strong></p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Debt Eraser Pro Community! 🎉',
    htmlContent
  });
}

/**
 * Send consultation confirmation email
 */
export async function sendConsultConfirmationEmail(email: string, name: string): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10b981;">Your Consultation is Confirmed! ✅</h1>

      <p>Hey ${name},</p>

      <p><strong>Your 1-on-1 strategy session is ready to be scheduled!</strong></p>

      <p>Go to your dashboard and click the Calendar tab to book your session at a time that works for you.</p>

      <p><a href="https://debteraserpro.com"
            style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
         Schedule Your Session
      </a></p>

      <p><strong>What to expect:</strong></p>
      <ul>
        <li>60-minute personalized strategy call</li>
        <li>Custom action plan for your specific situation</li>
        <li>Template customization help</li>
        <li>Q&A with expert guidance</li>
      </ul>

      <p>See you soon!<br>
      <strong>The Debt Eraser Team</strong></p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Your Consultation is Confirmed! ✅',
    htmlContent
  });
}
