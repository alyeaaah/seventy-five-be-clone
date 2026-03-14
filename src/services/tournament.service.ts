import { AppDataSource } from "../data-source";
import { Tournament } from "../entities/Tournament";
import { PlayerTeam } from "../entities/PlayerTeam";
import { PTStatusEnum } from "../entities/PlayerTeam";
import { IsNull } from "typeorm";
import { v4 as uuidv4 } from 'uuid';
import { Team } from "../entities/Team";

export class TournamentService {
  async requestJoinTournament(playerUuid: string, tournamentUuid: string, partnerUuid?: string) {
    const tRepo = AppDataSource.getRepository(Tournament);
    const ptRepo = AppDataSource.getRepository(PlayerTeam);

    // Check if tournament exists
    const tournament = await tRepo.findOne({ where: { uuid: tournamentUuid, deletedAt: IsNull() } });
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (!tournament.draft_pick && !partnerUuid) {
      return {
        message: "Partner is required for this tournament",
        error: 400
      };
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

    await AppDataSource.transaction(async (tm) => {
      
      const teamUuid = uuidv4();
      // Create join request
      const playerTeams: PlayerTeam[] = [];
      const playerTeam = new PlayerTeam();
      playerTeam.uuid = uuidv4();
      playerTeam.player_uuid = playerUuid;
      playerTeam.tournament_uuid = tournamentUuid;
      playerTeam.team_uuid = teamUuid;
      playerTeam.status = PTStatusEnum.REQUESTED;
      playerTeam.createdBy = playerUuid;

      playerTeams.push(playerTeam);

      if (partnerUuid && !tournament.draft_pick) {
        const partnerTeam = new PlayerTeam();
        partnerTeam.uuid = uuidv4();
        partnerTeam.player_uuid = partnerUuid;
        partnerTeam.tournament_uuid = tournamentUuid;
        partnerTeam.team_uuid = teamUuid;
        partnerTeam.status = PTStatusEnum.REQUESTED;
        partnerTeam.createdBy = playerUuid;

        playerTeams.push(partnerTeam);
      }

      await tm.save(playerTeams);
    });


    return {
      message: "Join request sent successfully",
      status: PTStatusEnum.REQUESTED
    };
  }

  async updateJoinRequestStatus(playerUuid: string, tournamentUuid: string, adminUuid: string, status: 'approve' | 'reject') {
    const ptRepo = AppDataSource.getRepository(PlayerTeam);
    const tRepo = AppDataSource.getRepository(Tournament);

    // Check if tournament exists
    const tournament = await tRepo.findOne({ where: { uuid: tournamentUuid, deletedAt: IsNull() } });
    if (!tournament) {
      throw new Error("Tournament not found");
    }

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

    await AppDataSource.transaction(async (tm) => {
      if (!tournament.draft_pick) {
        const teamRepo = tm.getRepository(Team);
        const [currentTeams, teamIsExist] = await Promise.all([
          teamRepo.find({
            where: {
              tournament_uuid: tournamentUuid,
              deletedAt: IsNull()
            }
          }),
          teamRepo.findOne({
            where: {
              tournament_uuid: tournamentUuid,
              uuid: playerTeam.team_uuid,
              deletedAt: IsNull()
            }
          })
        ]);

        if (!teamIsExist) {
          const team = new Team();
          team.uuid = playerTeam.team_uuid || uuidv4();
          team.tournament_uuid = tournamentUuid;
          team.name = `Team ${currentTeams.length + 1}`;
          team.createdBy = adminUuid;
          await tm.save(team);
        }else{
          throw new Error("Team already exists");
          
        }
      }

      playerTeam.status = status === 'approve' ? PTStatusEnum.APPROVED : PTStatusEnum.REJECTED;
      // Note: updatedBy field doesn't exist in PlayerTeam entity
      await tm.save(playerTeam);
    });

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
