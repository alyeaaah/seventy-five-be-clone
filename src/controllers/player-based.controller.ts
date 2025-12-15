import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { PlayerTeam } from "../entities/PlayerTeam";
import { Brackets, In, IsNull, Not } from "typeorm";
import { Tournament } from "../entities/Tournament";

export default class PlayerBasedController {
  constructor() {
  }

  async getTournamentsByPlayer(req: any, res: any) {
    const utilLib = new Util();
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


      utilLib.loggingRes(req, {
        data: tournamentsData,
        totalRecords,
        currentPage: Number(page || "1"),
        totalPages: Math.ceil(totalRecords / Number(limit || "10"))
      });
      return res.json({
        data: tournamentsData,
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
    const utilLib = new Util();
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
      const tournamentsRepo = AppDataSource.getRepository(Tournament)
      const tournamentsData = await tournamentsRepo.find({
        where: {
          uuid: Not(In(tournamentUuids)),
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
          uuid: In(tournamentUuids),
          deletedBy: IsNull()
        }
      });

      utilLib.loggingRes(req, {
        data: tournamentsData,
        totalRecords,
        currentPage: Number(page || "1"),
        totalPages: Math.ceil(totalRecords / Number(limit || "10"))
      });
      return res.json({
        data: tournamentsData,
        totalRecords,
        currentPage: Number(page || "1"),
        totalPages: Math.ceil(totalRecords / Number(limit || "10")),
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
