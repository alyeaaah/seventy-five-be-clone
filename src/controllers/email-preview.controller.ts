import { Request, Response } from 'express';
import { EmailService } from '../services/email.service';

export class EmailPreviewController {
  async previewTournamentStatusEmail(req: Request, res: Response) {
    try {
      const {
        playerName = 'John Doe',
        tournamentName = 'Summer Tennis Championship',
        tournamentType = 'Singles',
        tournamentDate = '15 July 2024',
        tournamentLocation = 'Seventy Five Tennis Club',
        status = 'APPROVED'
      } = req.query;

      const emailService = new EmailService();
      const html = await emailService.generateTournamentStatusEmailHtml(
        playerName as string,
        tournamentName as string,
        tournamentType as string,
        tournamentDate as string,
        tournamentLocation as string,
        status as string
      );

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error generating email preview',
        error: error.message
      });
    }
  }

  async previewEmailTemplate(req: Request, res: Response) {
    try {
      const { template, ...params } = req.query;

      let html = '';
      const emailService = new EmailService();

      switch (template) {
        case 'tournament-status':
          html = await emailService.generateTournamentStatusEmailHtml(
            params.playerName as string || 'John Doe',
            params.tournamentName as string || 'Summer Tennis Championship',
            params.tournamentType as string || 'Singles',
            params.tournamentDate as string || '15 July 2024',
            params.tournamentLocation as string || 'Seventy Five Tennis Club',
            params.status as string || 'APPROVED'
          );
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid template type'
          });
      }

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error generating email preview',
        error: error.message
      });
    }
  }
}
