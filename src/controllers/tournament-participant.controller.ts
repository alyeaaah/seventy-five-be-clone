import { AppDataSource } from "../data-source";
import { PlayerTeam, PTStatusEnum } from "../entities/PlayerTeam";
import { Tournament } from "../entities/Tournament";
import { Player } from "../entities/Player";
import { TournamentService } from "../services/tournament.service";
import { TournamentParticipantService } from "../services/tournament-participant.service";
import { DraftPick, DraftPickStatus } from "../entities/DraftPick";
import { In, IsNull } from "typeorm";
import { Response, Request } from "express";
import { emailService } from "../services/email.service";
import Util from "../lib/util.lib";

export default class TournamentParticipantController {
  constructor() {
    this.updateParticipants = this.updateParticipants.bind(this);
    this.getParticipants = this.getParticipants.bind(this);
    this.removeParticipant = this.removeParticipant.bind(this);
    this.bulkUpdateStatus = this.bulkUpdateStatus.bind(this);
  }
  private tournamentService = new TournamentService();
  private tournamentParticipantService = new TournamentParticipantService();

  async updateParticipants(req: Request, res: Response) {
    const { tournamentUuid } = req.params;
    const { draft_pick_id, player_uuid, status, notify_email, target_uuid } = req.body; // Array of participant data

    try {
      if (!tournamentUuid) {
        throw new Error("Tournament UUID is required");
      }

      if (!draft_pick_id || !player_uuid || !status) {
        throw new Error("Draft Pick UUID, player UUID and status are required");
      }
      if (!status || !Object.values(DraftPickStatus).includes(status)) {
        throw new Error("Valid status is required");
      }


      // Check if tournament exists
      const tournamentRepo = AppDataSource.getRepository(Tournament);
      const tournament = await tournamentRepo.findOne({
        where: { uuid: tournamentUuid, deletedAt: IsNull() }
      });

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      const dpRepo = AppDataSource.getRepository(DraftPick);
      // Update participants in transaction
      await AppDataSource.transaction(async (tm) => {
        const dpData = await dpRepo.findOne({
          where: {
            id: draft_pick_id,
            tournament_uuid: tournamentUuid,
            deletedAt: IsNull()
          }
        })
        if (!dpData) {
          throw new Error("Draft pick not found");
        }
        dpData.status = status;
        if (notify_email) {
          dpData.approval_email_sent = true;
        }
        if (target_uuid) {
          dpData.tournament_uuid = target_uuid;
        }
        await tm.save(dpData);
        if (notify_email) {
          await this.sendEmailAproval(player_uuid, tournamentUuid, status);
        }
      });

      res.status(200).json({
        success: true,
        message: "Tournament participants updated successfully",
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update tournament participants"
      });
    }
  }

  async getParticipants(req: any, res: any, isPublic?: boolean) {
    const { tournamentUuid } = req.params;
    let { status, page = 1, limit = 20, tournamentEventUuid } = req.query;
    const userData = req.data?.uuid || undefined;
    try {
      if (!tournamentUuid) {
        throw new Error("Tournament UUID is required");
      }
    if (!tournamentEventUuid) {
      const result = await this.tournamentParticipantService.getParticipants(
        tournamentUuid,
        status ? (Array.isArray(status) ? status as DraftPickStatus[] : [status as DraftPickStatus]) : undefined,
        Number(page),
        Number(limit),
        isPublic
      );
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      const result = await this.tournamentParticipantService.getParticipantsByEvent(
        tournamentEventUuid as string,
        status ? (Array.isArray(status) ? status as DraftPickStatus[] : [status as DraftPickStatus]) : undefined,
        Number(page),
        Number(limit),
        isPublic
      );
      res.status(200).json({
        success: true,
        data: result
      });
    }


    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to get tournament participants"
      });
    }
  }

  async removeParticipant(req: Request, res: Response) {
    const { tournamentUuid } = req.params;
    const { draft_pick_id, playerUuid } = req.body;

    try {
      if (!tournamentUuid || !playerUuid || !draft_pick_id) {
        throw new Error("Tournament UUID, Player UUID, and Draft Pick ID are required");
      }

      const dpRepo = AppDataSource.getRepository(DraftPick);
      const draftPick = await dpRepo.findOne({
        where: {
          player_uuid: playerUuid,
          tournament_uuid: tournamentUuid,
          id: draft_pick_id,
          deletedAt: IsNull()
        }
      });

      if (!draftPick) {
        throw new Error("Participant not found");
      }

      // Soft delete participant
      draftPick.deletedAt = new Date();
      draftPick.deletedBy = (req as any).data?.uuid;
      await dpRepo.save(draftPick);

      res.status(200).json({
        success: true,
        message: "Participant removed successfully",
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to remove participant"
      });
    }
  }

  async bulkUpdateStatus(req: Request, res: Response) {
    const { tournamentUuid } = req.params;
    const { draft_pick_ids, status } = req.body;

    try {
      if (!tournamentUuid) {
        throw new Error("Tournament UUID is required");
      }

      if (!draft_pick_ids || !Array.isArray(draft_pick_ids) || draft_pick_ids.length === 0) {
        throw new Error("Draft Pick UUIDs array is required");
      }

      if (!status || !Object.values(DraftPickStatus).includes(status)) {
        throw new Error("Valid status is required");
      }

      const ptRepo = AppDataSource.getRepository(PlayerTeam);
      
      // Update all specified participants
      const updateResult = await ptRepo.update(
        {
          id: In(draft_pick_ids),
          tournament_uuid: tournamentUuid,
          deletedAt: IsNull()
        },
        {
          status: status
        }
      );

      res.status(200).json({
        success: true,
        message: "Participants status updated successfully",
        data: {
          tournamentUuid,
          updatedCount: updateResult.affected || 0,
          status: status
        }
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update participants status"
      });
    }
  }
  async sendEmailAproval(player_uuid: string, tournamentUuid: string, status: string) {
    const utilLib = Util.getInstance();
    try {
      // Fetch player information
      const playerRepo = AppDataSource.getRepository(Player);
      const player = await playerRepo.findOne({ 
        where: { uuid: player_uuid, deletedAt: IsNull() } 
      });

      if (!player) {
        console.error('Player not found for email notification:', player_uuid);
        return;
      }

      // Fetch tournament information
      const tournamentRepo = AppDataSource.getRepository(Tournament);
      const tournament = await tournamentRepo.findOne({
        where: { uuid: tournamentUuid, deletedAt: IsNull() }
      });

      if (!tournament) {
        console.error('Tournament not found for email notification:', tournamentUuid);
        return;
      }

      // Send tournament status email using email service
      await emailService.sendTournamentStatusEmail(
        player.email,
        player.name,
        tournament.name,
        tournament.type+ " Doubles",
        tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD',
        tournament.court?.name || "Seventy Five Basecamp",
        status
      );

      utilLib.logging('Info',`Tournament status email sent to ${player.email}: ${status}`);

    } catch (error) {
      utilLib.loggingError('Error sending tournament status email:', error);
    }
  }
}
