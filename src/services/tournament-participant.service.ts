import { AppDataSource } from "../data-source";
import { DraftPick, DraftPickStatus } from "../entities/DraftPick";
import { Player } from "../entities/Player";
import { Tournament } from "../entities/Tournament";
import { FindOptionsWhere, In, IsNull } from "typeorm";

export class TournamentParticipantService {
  async getParticipants(
    tournamentUuid: string,
    status?: DraftPickStatus[],
    page: number = 1,
    limit: number = 10
  ) {
    try {
      const dpRepo = AppDataSource.getRepository(DraftPick);
      const tournamentRepo = AppDataSource.getRepository(Tournament);

      // Check if tournament exists
      const tournament = await tournamentRepo.findOne({
        where: { uuid: tournamentUuid, deletedAt: IsNull() }
      });

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      // Build where condition
      const whereCondition: FindOptionsWhere<DraftPick> = {
        tournament_uuid: tournamentUuid,
        deletedAt: IsNull()
      };

      if (status && status.length > 0) {
        whereCondition.status = In(status);
      }

      // Get total count for pagination
      const totalCount = await dpRepo.count({
        where: whereCondition
      });

      // Get draft picks with player relations
      const draftPicks = await dpRepo.find({
        where: whereCondition,
        relations: {
          player: {
            level: true
          },
          partner: {
            level: true
          }
        },
        order: {
          createdAt: 'ASC'
        },
        skip: (page - 1) * limit,
        take: limit
      });

      // Format response data
      const participants = draftPicks.map(dp => ({
        ...dp,
        player: dp.player ? {
          uuid: dp.player.uuid,
          name: dp.player.name,
          nickname: dp.player.nickname,
          email: dp.player.email,
          media_url: dp.player.media_url,
          city: dp.player.city,
          level: dp.player.level ? {
            uuid: dp.player.level.uuid,
            name: dp.player.level.name
          } : null
        } : null,
        partner: dp.partner ? {
          uuid: dp.partner.uuid,
          name: dp.partner.name,
          nickname: dp.partner.nickname,
          email: dp.partner.email,
          media_url: dp.partner.media_url,
          city: dp.partner.city,
          level: dp.partner.level ? {
            uuid: dp.partner.level.uuid,
            name: dp.partner.level.name
          } : null
        } : null
      }));

      return {
        participants,
        pagination: {
          current: page,
          pageSize: limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };

    } catch (error) {
      console.error('Error getting tournament participants:', error);
      throw error;
    }
  }

  async getParticipantById(playerUuid: string, tournamentUuid: string) {
    try {
      const dpRepo = AppDataSource.getRepository(DraftPick);
      const playerRepo = AppDataSource.getRepository(Player);

      const draftPick = await dpRepo.findOne({
        where: {
          player_uuid: playerUuid,
          tournament_uuid: tournamentUuid,
          deletedAt: IsNull()
        },
        relations: {
          player: {
            level: true
          }
        }
      });

      if (!draftPick) {
        throw new Error("Participant not found");
      }

      return {
        id: draftPick.id,
        player_uuid: draftPick.player_uuid,
        tournament_uuid: draftPick.tournament_uuid,
        tournament_event_uuid: draftPick.tournament_event_uuid,
        status: draftPick.status,
        position: draftPick.position,
        commitment_fee: draftPick.commitment_fee,
        seeded: draftPick.seeded,
        pickingAt: draftPick.pickingAt,
        createdAt: draftPick.createdAt,
        updatedAt: draftPick.updatedAt,
        player: draftPick.player ? {
          uuid: draftPick.player.uuid,
          name: draftPick.player.name,
          nickname: draftPick.player.nickname,
          email: draftPick.player.email,
          level: draftPick.player.level ? {
            uuid: draftPick.player.level.uuid,
            name: draftPick.player.level.name
          } : null,
          media_url: draftPick.player.media_url,
          city: draftPick.player.city
        } : null
      };

    } catch (error) {
      console.error('Error getting participant by ID:', error);
      throw error;
    }
  }

  async getParticipantsByStatus(tournamentUuid: string, status: DraftPickStatus) {
    try {
      const result = await this.getParticipants(tournamentUuid, [status], 1, 1000);
      return result.participants;
    } catch (error) {
      console.error('Error getting participants by status:', error);
      throw error;
    }
  }

  async getParticipantStats(tournamentUuid: string) {
    try {
      const dpRepo = AppDataSource.getRepository(DraftPick);

      const stats = await dpRepo
        .createQueryBuilder("dp")
        .select("dp.status", "status")
        .addSelect("COUNT(*)", "count")
        .where("dp.tournament_uuid = :tournamentUuid", { tournamentUuid })
        .andWhere("dp.deletedAt IS NULL")
        .groupBy("dp.status")
        .getRawMany();

      const totalParticipants = await dpRepo.count({
        where: {
          tournament_uuid: tournamentUuid,
          deletedAt: IsNull()
        }
      });

      return {
        totalParticipants,
        statusBreakdown: stats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {} as Record<string, number>)
      };

    } catch (error) {
      console.error('Error getting participant stats:', error);
      throw error;
    }
  }
}
