import { AppDataSource } from "../data-source";
import { Tournament } from "../entities/Tournament";
import { PlayerTeam } from "../entities/PlayerTeam";
import { PTStatusEnum } from "../entities/PlayerTeam";
import { IsNull } from "typeorm";

export class TournamentService {
  async requestJoinTournament(playerUuid: string, tournamentUuid: string) {
    const tRepo = AppDataSource.getRepository(Tournament);
    const ptRepo = AppDataSource.getRepository(PlayerTeam);

    // Check if tournament exists
    const tournament = await tRepo.findOne({ where: { uuid: tournamentUuid } });
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check if player already joined
    const existingRequest = await ptRepo.findOne({
      where: {
        player_uuid: playerUuid,
        tournament_uuid: tournamentUuid,
        deletedAt: IsNull()
      }
    });

    if (existingRequest) {
      throw new Error("You have already joined this tournament");
    }

    // Create join request
    const playerTeam = new PlayerTeam();
    playerTeam.uuid = require("uuid").v4();
    playerTeam.player_uuid = playerUuid;
    playerTeam.tournament_uuid = tournamentUuid;
    playerTeam.status = PTStatusEnum.REQUESTED;
    playerTeam.createdBy = playerUuid;

    await ptRepo.save(playerTeam);

    return {
      message: "Join request sent successfully",
      status: PTStatusEnum.REQUESTED
    };
  }

  async updateJoinRequestStatus(playerUuid: string, tournamentUuid: string, adminUuid: string, status: 'approve' | 'reject') {
    const ptRepo = AppDataSource.getRepository(PlayerTeam);

    const playerTeam = await ptRepo.findOne({
      where: {
        player_uuid: playerUuid,
        tournament_uuid: tournamentUuid,
        status: PTStatusEnum.REQUESTED,
        deletedAt: IsNull()
      }
    });

    if (!playerTeam) {
      throw new Error("Join request not found");
    }

    playerTeam.status = status === 'approve' ? PTStatusEnum.APPROVED : PTStatusEnum.REJECTED;
    // Note: updatedBy field doesn't exist in PlayerTeam entity
    await ptRepo.save(playerTeam);

    return {
      message: `Join request ${status}d successfully`,
      status: playerTeam.status
    };
  }

  async getTournamentParticipants(tournamentUuid: string) {
    const ptRepo = AppDataSource.getRepository(PlayerTeam);

    const participants = await ptRepo.find({
      where: {
        tournament_uuid: tournamentUuid,
        deletedAt: IsNull()
      },
      relations: {
        player: true
      }
    });

    return participants.map(pt => ({
      uuid: pt.uuid,
      player_uuid: pt.player_uuid,
      player_name: pt.player?.name,
      status: pt.status,
      createdAt: pt.createdAt,
      // Note: updatedAt field doesn't exist in PlayerTeam entity
    }));
  }
}
