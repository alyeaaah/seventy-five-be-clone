import config from './../config';
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
      port: config.smtp.port,
      secure: false,
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
    const confirmationUrl = `${process.env.FRONTEND_URL || 'https://seventyfive.club'}/confirm-email?code=${confirmationCode}`;
    
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

  async generateTournamentStatusEmailHtml(playerName: string, tournamentName: string, tournamentType: string, tournamentDate: string, tournamentLocation: string, status: string): Promise<string> {
    const isApproved = status.toUpperCase() === 'APPROVED';
    const isWaitlisted = status.toUpperCase()==="WAITLISTED"
    const statusText = isApproved ? 'Approved' : 'Updated';
    const statusColor = isApproved ? '#10b981' : (isWaitlisted ? '#3b82f6' : '#ef4444');
    const statusBgColor = isApproved ? '#d1fae5' : (isWaitlisted ? '#dbeafe' : '#fef2f2');
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Tournament Registration ${statusText}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #064E3B; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 8px 30px 30px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .status-badge { display: inline-block; background: ${statusBgColor}; color: ${statusColor}; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 15px 0; }
            .tournament-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .info-label { font-weight: bold; color: #666; }
            .info-value { color: #333; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header" style="display: flex; align-items: center; justify-content: center; gap: 20px;">
            <img src="https://res.cloudinary.com/doqyrkqgw/image/upload/v1778590132/SFLOGO_copy_q8lxgu.png" alt="Seventy Five Tennis Club Logo" width="60" height="48" style="display: block;">
            <div>
              <h1 style="margin: 0; font-size: 24px;">Seventy Five Tennis Club</h1>
              </div>
          </div>
          <div class="content">
            <p style="margin: 4px auto; font-size: 16px; width:100%; text-align:center;">Tournament Registration Update</p>
            <h2>Hi ${playerName},</h2>
            <p>Your registration for the tournament below has been <span class="status-badge">${statusText}</span>.</p>
            
            <div class="tournament-info">
              <h3>Tournament Details</h3>
              <div class="info-row">
                <span class="info-label">Tournament:</span>
                <span class="info-value">${tournamentName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Type:</span>
                <span class="info-value"> ${tournamentType}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${tournamentDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Location:</span>
                <span class="info-value">${tournamentLocation}</span>
              </div>
            </div>

            ${isApproved ? `
              <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #065f46; margin-top: 0;">🎉 Congratulations!</h3>
                <p style="color: #065f46;">Your registration has been approved. You are now officially registered for this tournament.</p>
                <p style="color: #065f46;">Please make sure to arrive at least 30 minutes before your scheduled match time. A technical meeting will be scheduled prior to the tournament, and you will receive detailed information about the time, location, and agenda via email or Whatsapp Message.</p>
                <p style="color: #065f46;">If you have any questions, please don't hesitate to contact us.</p>
              </div>
              <a href="${process.env.FRONTEND_URL || 'https://seventyfive.club'}/tournament" class="button">
                View Tournament Details
              </a>
            ` : `
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <h3 style="color: #991b1b; margin-top: 0;">Registration Update</h3>
                <p style="color: #991b1b;">Your tournament registration status has been updated to ${status}.</p>
                ${ status =='WAITLISTED' ? 'This means you are currently on our curation. We prioritize players we have seen on court, but we will notify you if a spot becomes available.' : ''}
                <p style="color: #991b1b;">If you have questions about your registration status, please contact our tournament administrators.</p>
              </div>
              <a href="${process.env.FRONTEND_URL || 'https://seventyfive.club'}/tournament" class="button">
                View Other Tournaments
              </a>
            `}

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              If you have questions about your registration, please contact our support team.
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Seventy Five Tennis Club. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
    
    return html;
  }

  async sendTournamentStatusEmail(playerEmail: string, playerName: string, tournamentName: string, tournamentType: string, tournamentDate: string, tournamentLocation: string, status: string): Promise<void> {
    const isApproved = status.toUpperCase() === 'APPROVED';
    
    const subject = isApproved 
      ? `Tournament Registration Approved - ${tournamentName}`
      : `Tournament Registration Update - ${tournamentName}`;

    const html = await this.generateTournamentStatusEmailHtml(
      playerName,
      tournamentName,
      tournamentType,
      tournamentDate,
      tournamentLocation,
      status
    );

    await this.sendEmail({
      to: playerEmail,
      subject,
      html,
    });

    console.log(`Tournament status email sent to ${playerEmail}: ${status}`);
  }
}

export const emailService = new EmailService();
