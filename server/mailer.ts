import nodemailer from 'nodemailer';

interface ResetEmailOptions {
  to: string;
  name?: string;
  resetUrl: string;
  userIp?: string;
}

export function generatePasswordResetEmailHtml({ to, name, resetUrl, userIp }: ResetEmailOptions): string {
  const displayName = name || to.split('@')[0] || 'Valued Member';
  const formattedDate = new Date().toUTCString();

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Reset Your Password</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #08090d;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    a {
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        padding: 12px !important;
      }
      .card-body {
        padding: 24px 18px !important;
      }
      .btn-cta {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 30px 10px; background-color: #08090d; color: #ffffff;">

  <!-- Center wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #08090d;">
    <tr>
      <td align="center">
        
        <!-- Main Card Container -->
        <table role="presentation" class="email-container" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; margin: 0 auto; background-color: #12131c; border: 1px solid #232538; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #4c1d95 100%); padding: 36px 30px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 44px; height: 44px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; line-height: 44px; text-align: center; color: #ffffff; font-weight: 900; font-size: 20px; letter-spacing: 1px;">
                      N
                    </div>
                    <h1 style="margin: 14px 0 4px 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                      NEXUS STORE
                    </h1>
                    <p style="margin: 0; color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 500; letter-spacing: 0.5px;">
                      Digital Asset Marketplace
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card Content Body -->
          <tr>
            <td class="card-body" style="padding: 36px 32px; background-color: #12131c;">
              
              <!-- Greeting & Header -->
              <h2 style="margin: 0 0 12px 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                Password Reset Request
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                Hi <strong style="color: #f4f4f5;">${displayName}</strong>, we received a request to securely reset the password for your Nexus Store account (<span style="color: #c4b5fd; text-decoration: underline;">${to}</span>).
              </p>

              <p style="margin: 0 0 28px 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                Click the button below to choose a new password. For your security, this link will automatically expire in <strong>60 minutes</strong>.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 10px 0 30px 0;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="25%" stroke="f" fillcolor="#8b5cf6">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">Reset My Password &rarr;</center>
                    </v:roundrect>
                    <![endif]-->
                    <a href="${resetUrl}" class="btn-cta" target="_blank" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; display: inline-block; padding: 14px 34px; font-size: 15px; font-weight: 700; border-radius: 12px; text-decoration: none; text-align: center; box-shadow: 0 8px 25px rgba(139, 92, 246, 0.45); letter-spacing: 0.2px;">
                      Reset My Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link Box -->
              <div style="background-color: #171926; border: 1px solid #282a3e; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #71717a; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Button not working? Copy &amp; paste this URL:
                </p>
                <p style="margin: 0; word-break: break-all; color: #a78bfa; font-size: 12px; line-height: 1.5; font-family: monospace;">
                  <a href="${resetUrl}" style="color: #a78bfa; text-decoration: none;">${resetUrl}</a>
                </p>
              </div>

              <!-- Security Notice Banner -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1b1c28; border-left: 4px solid #8b5cf6; border-radius: 8px; margin-bottom: 10px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0 0 4px 0; color: #e4e4e7; font-size: 13px; font-weight: 600;">
                      Didn't request this change?
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                      If you did not initiate this request, you can safely ignore this email. Your account credentials remain safe and no changes have been applied.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Timestamp & Info -->
              <p style="margin: 18px 0 0 0; color: #52525b; font-size: 11px; text-align: center;">
                Requested on ${formattedDate} ${userIp ? `• IP: ${userIp}` : ''}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 30px; background-color: #0c0d14; border-top: 1px solid #1e202e; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #71717a; font-size: 12px;">
                Nexus Store • Next-Gen Digital Products &amp; Assets
              </p>
              <p style="margin: 0; color: #52525b; font-size: 11px;">
                © 2026 Nexus Store. All rights reserved. • Privacy Policy • Security Center
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

// Nodemailer Transporter Helper
export async function createEmailTransporter() {
  // 1. If explicit SMTP credentials configured in .env
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // 2. If Gmail App Password configured
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  // 3. Otherwise, create an automatic Ethereal test mail account for real test email previews
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch {
    // Return null if ethereal creation fails (offline fallback)
    return null;
  }
}

export async function sendPasswordResetEmail(options: ResetEmailOptions): Promise<{ success: boolean; previewUrl?: string; messageId?: string; error?: string }> {
  try {
    const html = generatePasswordResetEmailHtml(options);
    const transporter = await createEmailTransporter();

    if (!transporter) {
      console.log(`[EMAIL DISPATCH SIMULATION] Sent to ${options.to}. Reset URL: ${options.resetUrl}`);
      return {
        success: true,
        previewUrl: options.resetUrl,
      };
    }

    const fromAddress = process.env.SMTP_FROM || process.env.GMAIL_USER || '"Nexus Store Security" <security@nexusstore.com>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: '🔐 Reset Your Nexus Store Account Password',
      text: `Hello,\n\nPlease reset your password using the following secure link (expires in 60 minutes):\n\n${options.resetUrl}\n\nIf you did not request this, please ignore this email.`,
      html,
    });

    const etherealUrl = nodemailer.getTestMessageUrl(info);
    const previewUrl = etherealUrl ? etherealUrl.toString() : options.resetUrl;

    console.log(`[PREMIUM RESET EMAIL SENT] To: ${options.to}, MessageId: ${info.messageId}`);
    if (etherealUrl) {
      console.log(`[EMAIL LIVE PREVIEW URL]: ${etherealUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error: any) {
    console.error('Failed to send reset email:', error);
    return {
      success: false,
      error: error.message || 'Email delivery failed',
    };
  }
}
