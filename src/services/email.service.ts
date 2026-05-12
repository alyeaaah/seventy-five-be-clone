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
    const statusText = isApproved ? 'Approved' : 'Updated';
    const statusColor = isApproved ? '#10b981' : '#ef4444';
    const statusBgColor = isApproved ? '#d1fae5' : '#fef2f2';
    
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
            <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 465.37255 296.81117" width="60" height="48" class="text-white">
              <g id="Layer_1-2" data-name="Layer 1">
                <rect x="0.5" y="0.5" width="464.37255" height="295.81117" fill="none" stroke="none" opacity="0"></rect>
                <circle cx="148.45576" cy="148.40558" r="103.87314" fill="none" stroke="currentColor" stroke-width="15" stroke-miterlimit="10"></circle>
                <circle cx="318.07152" cy="148.40558" r="103.87314" fill="none" stroke="currentColor" stroke-width="15" stroke-miterlimit="10"></circle>
                <circle cx="436.01428" cy="30.66987" r="25.13779" fill="none" stroke="currentColor" stroke-width="5" stroke-miterlimit="10"></circle>
                <path d="M134.05078,167.18315c.87891,1.69238,2.0459,3.0625,3.50195,4.11133,1.45459,1.0498,3.1626,1.82715,5.12598,2.33398,1.96191.50781,3.99219.76172,6.09033.76172,1.42139,0,2.94385-.11719,4.56787-.35547,1.62402-.23633,3.14697-.69238,4.56787-1.37012,1.42139-.67578,2.60449-1.60645,3.55273-2.79102.94678-1.18359,1.4209-2.69043,1.4209-4.51758,0-1.96191-.62646-3.55273-1.87744-4.77051-1.25293-1.21777-2.89307-2.2334-4.92334-3.04492-2.03027-.8125-4.33154-1.52344-6.90234-2.13184-2.57275-.60938-5.17676-1.28516-7.81592-2.03027-2.70752-.67578-5.34668-1.50488-7.91748-2.4873-2.57275-.97949-4.87256-2.24854-6.90234-3.80615-2.03027-1.55566-3.67188-3.50195-4.92334-5.83643-1.25293-2.33496-1.87793-5.15967-1.87793-8.47607,0-3.7207.79492-6.95312,2.38574-9.69385,1.58887-2.74023,3.66992-5.02441,6.24268-6.85156,2.5708-1.82715,5.48096-3.17969,8.72949-4.06006,3.24805-.87891,6.49609-1.31982,9.74463-1.31982,3.78906,0,7.42578.42383,10.91162,1.26904,3.48486.84668,6.58057,2.21729,9.28809,4.11084,2.70557,1.89551,4.85449,4.31396,6.44531,7.25781,1.58936,2.94385,2.38574,6.51367,2.38574,10.70898h-15.4292c-.13623-2.16504-.59326-3.95898-1.37012-5.37988-.77881-1.42139-1.81152-2.5376-3.09619-3.34961-1.28613-.81201-2.75781-1.38623-4.41553-1.72559-1.65869-.33789-3.46826-.50781-5.43066-.50781-1.28613,0-2.57227.13672-3.85693.40625-1.28613.271-2.45361.74512-3.50195,1.4209-1.0498.67725-1.9126,1.52246-2.58838,2.5376-.67725,1.01514-1.01514,2.30127-1.01514,3.85742,0,1.4209.26953,2.57227.81201,3.45117.54102.88037,1.60645,1.69238,3.19727,2.43604,1.58936.74561,3.78906,1.48926,6.59814,2.2334,2.80713.74512,6.479,1.69189,11.01318,2.8418,1.35303.27148,3.23096.76172,5.63379,1.47217,2.40137.71045,4.78662,1.84424,7.15625,3.40039,2.36768,1.55762,4.41553,3.63818,6.14111,6.24268,1.72559,2.60547,2.58838,5.93848,2.58838,9.99805,0,3.31641-.64404,6.39551-1.92871,9.2373-1.28613,2.8418-3.19727,5.2959-5.73486,7.35938-2.5376,2.06445-5.68457,3.67188-9.44043,4.82129-3.75537,1.15039-8.10449,1.72559-13.04346,1.72559-3.99365,0-7.8667-.49121-11.62256-1.47168-3.75537-.98047-7.07178-2.52051-9.94727-4.61816-2.87744-2.09766-5.16113-4.77148-6.85205-8.01953-1.69189-3.24805-2.50391-7.10547-2.43604-11.57129h15.4292c0,2.43555.43896,4.50098,1.31934,6.19141Z" fill="currentColor" stroke="currentColor" stroke-width="0.75" stroke-miterlimit="10"></path>
                <path d="M350.29102,112.57279v13.39893h-35.01953v16.74854h30.35059v12.38379h-30.35059v29.94434h-15.93652v-72.47559h50.95605Z" fill="currentColor" stroke="currentColor" stroke-miterlimit="10"></path>
                <path d="M441.97266,15.97514c1.31641-.02734,2.51562.08887,3.59863.34912,1.08301.26123,2.00781.69922,2.77637,1.31641.7666.6167,1.35645,1.41846,1.76758,2.40576.41211.98682.61719,2.19385.61719,3.61914,0,.98682-.16406,1.93262-.49316,2.8374s-.7959,1.70703-1.39844,2.40625c-.60352.69873-1.31641,1.28174-2.13867,1.74756-.82227.4668-1.72754.76807-2.71387.90479v.08252c1.20605.38428,2.01465,1.04834,2.42578,1.99463.41113.9458.61719,2.00879.61719,3.18701,0,.6582-.03516,1.44678-.10254,2.36475-.06934.91895-.10352,1.83008-.10352,2.73486,0,.6582.02734,1.28223.08301,1.87158.05469.58984.16406,1.10352.3291,1.54199h-6.29297c-.08203-.35596-.15039-.69189-.20508-1.00781-.05566-.31445-.08301-.63721-.08301-.96631,0-.98682.05469-1.98047.16504-2.98145.10938-1.00049.16406-1.99463.16406-2.98193,0-.7124-.10254-1.29541-.30762-1.74756-.20605-.45264-.49414-.81543-.86426-1.08984-.37012-.27393-.81641-.45898-1.33691-.55518-.52051-.0957-1.09668-.14404-1.72656-.14404h-6.08691l-2.42676,11.47412h-6.41504l6.12793-29.36377h14.02344ZM437.61328,29.25883c.87695,0,1.71289-.08887,2.50879-.26758.79492-.17773,1.50098-.45215,2.11816-.82227s1.11035-.84961,1.48047-1.43945c.37012-.58936.55469-1.29541.55469-2.11816,0-.79492-.12988-1.43213-.39062-1.9126-.26074-.479-.61035-.84277-1.04883-1.08984-.43848-.24658-.94531-.41113-1.52148-.49316-.5752-.08252-1.17871-.12354-1.80957-.12354h-6.12793l-1.72656,8.2666h5.96289Z" fill="currentColor" stroke="currentColor" stroke-width="0.75" stroke-miterlimit="10"></path>
              </g>
            </svg>
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
