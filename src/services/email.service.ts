import config from 'config';
import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host || 'mail.catchme.icu',
      port: parseInt(config.smtp.port || '587'),
      secure: config.smtp.secure === 'true',
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || `"Seventy Five Tennis" <noreply@catchme.icu>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendConfirmationEmail(email: string, name: string, confirmationCode: string): Promise<void> {
    const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirm-email?code=${confirmationCode}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header"><h1>Welcome to Seventy Five Tennis Club!</h1></div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Thank you for registering with Seventy Five Tennis Club! To complete your registration and activate your account, please confirm your email address.</p>
          <p>Click the button below to confirm your email:</p>
          <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
          <p>Or you can copy and paste this link into your browser:</p>
          <p><a href="${confirmationUrl}">${confirmationUrl}</a></p>
          <p>This confirmation link will expire in 24 hours.</p>
          <p>If you didn't create an account with us, please ignore this email.</p>
        </div>
        <div class="footer"><p>&copy; 2024 Seventy Five Tennis Club. All rights reserved.</p></div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Confirm Your Email Address - Seventy Five Tennis Club',
      html,
    });
  }
}

export const emailService = new EmailService();
