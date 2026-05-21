import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: this.configService.get<boolean>('mail.secure'),
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.pass'),
      },
    });
  }

  async sendOtpEmail(to: string, firstName: string, otp: string): Promise<void> {
    const fromName = this.configService.get<string>('mail.fromName') || 'Nexus';
    const fromEmail = this.configService.get<string>('mail.fromEmail') || 'noreply@nexus.com';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 48px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Nexus</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Freelance Marketplace</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:48px;">
                    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:600;">Verify your email address</h2>
                    <p style="margin:0 0 32px;color:#6b7280;font-size:15px;line-height:1.6;">
                      Hi <strong style="color:#111827;">${firstName}</strong>, welcome to Nexus!
                      Enter the verification code below to activate your account.
                    </p>

                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background:#f9fafb;border:2px dashed #e5e7eb;border-radius:12px;padding:32px;">
                          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;font-weight:500;">Your verification code</p>
                          <p style="margin:0;color:#111827;font-size:48px;font-weight:700;letter-spacing:16px;font-family:'Courier New',monospace;">${otp}</p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">
                      This code expires in <strong style="color:#6b7280;">10 minutes</strong>. Do not share it with anyone.
                    </p>

                    <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0;">

                    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
                      If you didn't create a Nexus account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:24px 48px;border-top:1px solid #f3f4f6;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                      &copy; ${new Date().getFullYear()} Nexus Marketplace. All rights reserved.
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

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject: `${otp} — Your Nexus verification code`,
        html,
      });
      this.logger.log(`OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, firstName: string, resetToken: string): Promise<void> {
    const fromName = this.configService.get<string>('mail.fromName') || 'Nexus';
    const fromEmail = this.configService.get<string>('mail.fromEmail') || 'noreply@nexus.com';
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 48px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Nexus</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:48px;">
                    <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Reset your password</h2>
                    <p style="margin:0 0 32px;color:#6b7280;font-size:15px;line-height:1.6;">
                      Hi <strong style="color:#111827;">${firstName}</strong>, we received a request to reset your password.
                      Click the button below to set a new one.
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">
                      This link expires in 1 hour. If you didn't request this, ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:24px 48px;border-top:1px solid #f3f4f6;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                      &copy; ${new Date().getFullYear()} Nexus Marketplace
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

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject: 'Reset your Nexus password',
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${to}`, error);
      throw error;
    }
  }

  async sendBidAcceptedEmail(to: string, firstName: string, projectTitle: string, contractId: string): Promise<void> {
    const fromName = this.configService.get<string>('mail.fromName') || 'Nexus';
    const fromEmail = this.configService.get<string>('mail.fromEmail') || 'noreply@nexus.com';
    const frontendUrl = this.configService.get<string>('app.frontendUrl');

    const html = `
      <!DOCTYPE html><html>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
              <tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:40px 48px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">🎉 Bid Accepted!</h1>
              </td></tr>
              <tr><td style="padding:48px;">
                <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Congratulations, ${firstName}!</h2>
                <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                  Your bid on <strong style="color:#111827;">"${projectTitle}"</strong> has been accepted by the client.
                  A contract has been created and is waiting for your signature.
                </p>
                <table cellpadding="0" cellspacing="0">
                  <tr><td>
                    <a href="${frontendUrl}/contracts/${contractId}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                      View Contract
                    </a>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background:#f9fafb;padding:20px 48px;border-top:1px solid #f3f4f6;">
                <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">&copy; ${new Date().getFullYear()} Nexus Marketplace</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body></html>
    `;

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `🎉 Your bid was accepted — ${projectTitle}`,
      html,
    }).catch((e) => this.logger.error(`sendBidAcceptedEmail failed`, e));
  }

  async sendPaymentReceivedEmail(to: string, firstName: string, amount: number, milestoneTitle: string): Promise<void> {
    const fromName = this.configService.get<string>('mail.fromName') || 'Nexus';
    const fromEmail = this.configService.get<string>('mail.fromEmail') || 'noreply@nexus.com';
    const frontendUrl = this.configService.get<string>('app.frontendUrl');

    const html = `
      <!DOCTYPE html><html>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
              <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 48px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">💰 Payment Received</h1>
              </td></tr>
              <tr><td style="padding:48px;">
                <p style="margin:0 0 16px;color:#6b7280;font-size:15px;">Hi <strong style="color:#111827;">${firstName}</strong>,</p>
                <p style="margin:0 0 32px;color:#6b7280;font-size:15px;line-height:1.6;">
                  You have received a payment for your completed milestone.
                </p>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
                  <p style="margin:0 0 4px;color:#16a34a;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:1px;">Amount Received</p>
                  <p style="margin:0;color:#15803d;font-size:40px;font-weight:700;">$${amount.toFixed(2)}</p>
                  <p style="margin:8px 0 0;color:#4ade80;font-size:13px;">For: ${milestoneTitle}</p>
                </div>
                <table cellpadding="0" cellspacing="0">
                  <tr><td>
                    <a href="${frontendUrl}/payments" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                      View Wallet
                    </a>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background:#f9fafb;padding:20px 48px;border-top:1px solid #f3f4f6;">
                <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">&copy; ${new Date().getFullYear()} Nexus Marketplace</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body></html>
    `;

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `💰 Payment received: $${amount.toFixed(2)} — ${milestoneTitle}`,
      html,
    }).catch((e) => this.logger.error(`sendPaymentReceivedEmail failed`, e));
  }
}
