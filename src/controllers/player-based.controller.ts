import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { PlayerTeam } from "../entities/PlayerTeam";
import { Player } from "../entities/Player";
import { In, IsNull, MoreThanOrEqual, Not } from "typeorm";
import { Tournament } from "../entities/Tournament";

export default class PlayerBasedController {
  constructor() {
  }

  async getTournamentsByPlayer(req: any, res: any) {
    const utilLib = Util.getInstance();
    try {
      
      const player_uuid = req.params.uuid || req.data?.uuid;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      // First, get the teams the player has joined
      const playerTeams = await AppDataSource.getRepository(PlayerTeam)
        .createQueryBuilder("playerTeam")
        .where("playerTeam.player_uuid = :playerUuid", { playerUuid: player_uuid })
        .andWhere("playerTeam.deletedBy IS NULL")
        .getMany();

      // Extract the tournament UUIDs from the player teams
      const tournamentUuids = playerTeams.map(playerTeam => playerTeam.tournament_uuid);

      // Fetch tournaments based on those tournament UUIDs
      const tournamentsRepo = AppDataSource.getRepository(Tournament)
      const tournamentsData = await tournamentsRepo.find({
        where: {
          uuid: In(tournamentUuids),
          deletedBy: IsNull()
        },
        relations: {
          court: true,
          level: true,
          league: true,
          point_config: true,
          sponsors:true,
          playerTeams: {
            player:true
          }
        },
        order: {
          createdAt: "DESC"
        },
        skip: offset,
        take: limit,
      });

      const totalRecords = await tournamentsRepo.count({
        where: {
          uuid: In(tournamentUuids),
          deletedBy: IsNull(),
        }
      });
     
      let resultTournaments = tournamentsData;
      if (player_uuid) {
        resultTournaments = tournamentsData.map(tournament => {
          const playerTeam = tournament.playerTeams?.find(pt => pt.player_uuid === player_uuid);
          return {
            ...tournament,
            join_status: playerTeam ? playerTeam.status : null
          };
        });
      }
      resultTournaments = resultTournaments.map(tournament => {
        return {
          ...tournament,
          commitment_fee: Number(tournament.commitment_fee || "0"),
          max_player: tournament.max_player
        };
      });


      utilLib.loggingRes(req, {
        data: resultTournaments,
        totalRecords,
        currentPage: Number(page || "1"),
        totalPages: Math.ceil(totalRecords / Number(limit || "10"))
      });
      return res.json({
        data: resultTournaments,
        totalRecords,
        currentPage: Number(page || "1"),
        totalPages: Math.ceil(totalRecords / Number(limit || "10")),
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async getUpcomingTournamentByPlayer(req: any, res: any) {
    const utilLib = Util.getInstance();
    try {
      const player_uuid = req.params.uuid || req.data?.uuid;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // Extract the tournament UUIDs from the player teams
      const tournamentsRepo = AppDataSource.getRepository(Tournament)
      const tournamentsData = await tournamentsRepo.find({
        where: {
          status: Not(In(["ENDED"])),
          published_at: Not(IsNull()),
          deletedBy: IsNull()
        },
        relations: {
          court: true,
          level: true,
          league: true,
          point_config: true,
          sponsors:true,
          playerTeams:true
        },
        order: {
          createdAt: "DESC"
        },
        skip: offset,
        take: limit,
      });
      const totalRecords = await tournamentsRepo.count({
        where: {
          status: In(["PUBLISHED", "POSTPONED", "ONGOING"]),
          published_at: Not(IsNull()),
          deletedBy: IsNull()
        }
      });

      let resultTournaments = tournamentsData;
      if (player_uuid) {
        resultTournaments = tournamentsData.map(tournament => {
          const playerTeam = tournament.playerTeams?.find(pt => pt.player_uuid === player_uuid);
          return {
            ...tournament,
            join_status: playerTeam ? playerTeam.status : null
          };
        });
      }
      resultTournaments = resultTournaments.map(tournament => {
        return {
          ...tournament,
          commitment_fee: Number(tournament.commitment_fee || "0"),
          max_player: tournament.max_player
        };
      });

      utilLib.loggingRes(req, {
        data: resultTournaments,
        totalRecords,
        currentPage: Number(page || "1"),
        totalPages: Math.ceil(totalRecords / Number(limit || "10"))
      });
      return res.json({
        data: resultTournaments,
        totalRecords,
        currentPage: Number(page || "1"),
        totalPages: Math.ceil(totalRecords / Number(limit || "10")),
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async listDropdown(req: any, res: any) {
    const utilLib = Util.getInstance();
    try {
      const { keyword, tournamentUuid } = req.query;
      
      if (!keyword) {
        return res.json({ data: [] });
      }

      const playerRepo = AppDataSource.getRepository(Player);
      
      // Build base query for keyword search
      let queryBuilder = playerRepo
        .createQueryBuilder("player")
        .where("player.deletedBy IS NULL")
        .andWhere(
          "(player.name LIKE :keyword OR " +
          "player.nickname LIKE :keyword OR " +
          "player.username LIKE :keyword OR " +
          "player.email LIKE :keyword)",
          { keyword: `%${keyword}%` }
        );

      // If tournamentUuid is provided, exclude players already in the tournament
      if (tournamentUuid) {
        const subQuery = playerRepo
          .createQueryBuilder("player")
          .select("player.uuid")
          .innerJoin(PlayerTeam, "playerTeam", "playerTeam.player_uuid = player.uuid")
          .where("playerTeam.tournament_uuid = :tournamentUuid", { tournamentUuid })
          .andWhere("playerTeam.status = 'CONFIRMED'")
          .andWhere("playerTeam.deletedBy IS NULL");

        queryBuilder = queryBuilder.andWhere(`player.uuid NOT IN (${subQuery.getQuery()})`);
        queryBuilder.setParameters(subQuery.getParameters());
      }

      const players = await queryBuilder
        .select([
          "player.uuid",
          "player.name", 
          "player.nickname",
          "player.username",
          "player.email",
          "player.media_url"
        ])
        .orderBy("player.name", "ASC")
        .limit(20)
        .getMany();

      // Format response for dropdown
      const formattedPlayers = players.map(player => ({
        uuid: player.uuid,
        name: player.name,
        nickname: player.nickname,
        username: player.username,
        email: player.email,
        media_url: player.media_url,
      }));

      utilLib.loggingRes(req, { data: formattedPlayers });
      return res.json({ data: formattedPlayers });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}

