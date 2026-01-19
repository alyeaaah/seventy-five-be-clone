import Util from "../lib/util.lib";
import { Brackets, In, IsNull } from "typeorm";

import { AppDataSource } from "../data-source";
import { Tournament } from "../entities/Tournament";
import { Matches, MatchStatus } from "../entities/Matches";
import { Team } from "../entities/Team";
import { TournamentGroup } from "../entities/TournamentGroups";
import { Player } from "../entities/Player";
import { playerDummy } from "../lib/fake.lib";
import { groupResponseSchema, matchSchema } from "../schemas/tournament.schema";

export class MatchService {
  async list(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { tournament_uuid, page, limit } = req.query;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: undefined,
      });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }

      const matchesRepo = AppDataSource.getRepository(Matches);
      const queryBuilder = matchesRepo
        .createQueryBuilder("matches")
        .leftJoinAndSelect("matches.home_team", "home")
        .leftJoinAndSelect("matches.away_team", "away")
        .leftJoinAndSelect("away.players", "away_players")
        .leftJoinAndSelect("home.players", "home_players")
        .leftJoinAndSelect("away_players.player", "away_player")
        .leftJoinAndSelect("home_players.player", "home_player")
        .leftJoinAndSelect("matches.court_field", "field")
        .leftJoinAndSelect("field.court", "court")
        .andWhere("matches.deletedAt IS NULL")
        .andWhere("matches.deletedBy IS NULL")
        .andWhere("away_players.deletedBy IS NULL")
        .andWhere("home_players.deletedBy IS NULL")
        .orderBy("matches.seed_index", "ASC")
        .orderBy("matches.round", "ASC");
      if (page && limit) {
        queryBuilder
          .skip((Number(page) - 1) * Number(limit))
          .take(Number(limit));
      }
      if (tournament_uuid) {
        queryBuilder
          .andWhere("matches.tournament_uuid = :uuid OR (:uuid IS NULL)", {
            uuid: tournament_uuid,
          });
      } else {
        queryBuilder
          .andWhere("matches.tournament_uuid IS NULL OR matches.tournament_uuid = ''");
      }
      const [data, totalRecords] = await queryBuilder.getManyAndCount();
      
      const result = data.map((match: any) => {
        const isHome = !["TBD", "BYE"].includes(match.home_team_uuid);
        const isAway = !["TBD", "BYE"].includes(match.away_team_uuid);
        return {
          ...match,
          uuid: match.uuid,
          date: match.time,
          with_ad: !!match.with_ad,
          home_team: {
            id: isHome ? match.home_team?.id : Number(match.round+''+match.seed_index),
            uuid: isHome ?  match.home_team?.uuid : match.home_team_uuid,
            name: isHome ? match.home_team?.name : match.home_team_uuid,
            alias: isHome ? match.home_team?.alias : match.home_team_uuid,
            players: isHome ? match.home_team?.players.map((player: any) => ({
              id: player.player?.id,
              uuid: player.player?.uuid,
              name: player.player?.name,
              nickname: player.player?.nickname,
              city: player.player?.city,
              media_url: player.player?.media_url,
              address: player.player?.address,
              phone: player.player?.phoneNumber,
              isVerified: player.player?.isVerified,
              level_uuid: player.player?.level_uuid,
              gender: player.player?.gender,
              username: player.player?.username,
              createdAt: player?.player?.createdAt,
              playstyleForehand: player?.player?.playstyleForehand,
              playstyleBackhand: player?.player?.playstyleBackhand
            })) : (playerDummy[match?.home_team_uuid || "TBD"] || [])
          },
          away_team: {
            id: isAway ? match.away_team?.id : Number(match.round+''+match.seed_index),
            uuid: isAway ?  match.away_team?.uuid : match.away_team_uuid,
            name: isAway ? match.away_team?.name : match.away_team_uuid,
            alias: isAway ? match.away_team?.alias : match.away_team_uuid,
            players: isAway ? match.away_team?.players.map((player: any) => ({
              id: player.player?.id,
              uuid: player.player?.uuid,
              name: player.player?.name,
              nickname: player.player?.nickname,
              city: player.player?.city,
              media_url: player.player?.media_url,
              address: player.player?.address,
              phone: player.player?.phoneNumber,
              isVerified: player.player?.isVerified,
              level_uuid: player.player?.level_uuid,
              gender: player.player?.gender,
              username: player.player?.username,
              createdAt: player?.player?.createdAt,
              playstyleForehand: player?.player?.playstyleForehand,
              playstyleBackhand: player?.player?.playstyleBackhand
            })) : (playerDummy[match?.away_team_uuid || "TBD"] || [])
          },
          court: match.tournament_uuid ? match.court_field?.name : `${match.court_field?.court?.name || ""} - ${match.court_field?.name || ""}`,
        };
      });

      utilLib.loggingRes(req, { data: result, totalRecords, currentPage: Number(page || "1"), totalPages: Math.ceil(totalRecords / Number(limit || "10")) });


      return res.json({
        data: result,
        totalRecords,
        currentPage: Number(page || "1"),
        totalPages: Math.ceil(totalRecords / Number(limit || "10")),
        
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      console.log(error);
      
      return res.status(400).json({ message: error.message });
    }
  }

  async detail(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const matchesRepo = AppDataSource.getRepository(Matches);
      const matchAvailable = await matchesRepo.findOneBy({ uuid, deletedAt: IsNull() });
      if (!matchAvailable) throw new Error(`Match doesn't exists`);

      const qbuilder = matchesRepo
        .createQueryBuilder("matches")
        .leftJoinAndSelect("matches.home_team", "home")
        .leftJoinAndSelect("matches.away_team", "away")
        .leftJoinAndSelect("matches.winner", "winner_team")
        .leftJoinAndSelect("away.players", "away_players")
        .leftJoinAndSelect("home.players", "home_players")
        .leftJoinAndSelect("away_players.player", "away_player")
        .leftJoinAndSelect("home_players.player", "home_player")
        .leftJoinAndSelect("matches.court_field", "court_field")
        .leftJoinAndSelect("court_field.court", "court")
        .leftJoinAndSelect("matches.sets", "set")
        .leftJoinAndSelect("set.setLogs", "setLogs")
        .leftJoinAndSelect("matches.matchHistories", "matchHistory")
        .andWhere("matches.deletedAt IS NULL")
        .andWhere("matches.deletedBy IS NULL")
        .andWhere("away_players.deletedBy IS NULL")
        .andWhere("home_players.deletedBy IS NULL")
        .andWhere("matches.uuid = :uuid", { uuid })
      if (!matchAvailable.tournament_uuid && matchAvailable.point_config_uuid) {
        qbuilder
          .leftJoinAndSelect("matches.point_config", "point_config")
          .leftJoinAndSelect("point_config.points", "points")
          .andWhere("points.round = matches.round");
      }
      const match  = await qbuilder.getOne();
      if (!match) throw new Error(`Data not found`);
      

      const isHome = !["TBD", "BYE"].includes(match.home_team_uuid);
      const isAway = !["TBD", "BYE"].includes(match.away_team_uuid);
      
      const data = {
        ...match,
        date: match.time,
        with_ad: !!match.with_ad,
        home_team: {
          id: isHome ? match.home_team?.id : Number(match.round+''+match.seed_index),
          uuid: isHome ?  match.home_team?.uuid : match.home_team_uuid,
          name: isHome ? match.home_team?.name : match.home_team_uuid,
          alias: isHome ? match.home_team?.alias : match.home_team_uuid,
          players: isHome ? match.home_team?.players?.map((player: any) => ({
            id: player.player?.id,
            uuid: player.player?.uuid,
            name: player.player?.name,
            nickname: player.player?.nickname,
            city: player.player?.city,
            media_url: player.player?.media_url,
            address: player.player?.address,
            height: player.player?.height,
            phone: player.player?.phoneNumber,
            isVerified: player.player?.isVerified,
            level_uuid: player.player?.level_uuid,
            gender: player.player?.gender,
            username: player.player?.username,
            createdAt: player?.player?.createdAt,
            playstyleForehand: player?.player?.playstyleForehand,
            playstyleBackhand: player?.player?.playstyleBackhand,
            skills: player?.player?.skills ? JSON.parse(player?.player?.skills) : undefined,
          })) : (playerDummy[match?.home_team_uuid || "TBD"] || [])
        },
        away_team: {
          id: isAway ? match.away_team?.id : Number(match.round+''+match.seed_index),
          uuid: isAway ?  match.away_team?.uuid : match.away_team_uuid,
          name: isAway ? match.away_team?.name : match.away_team_uuid,
          alias: isAway ? match.away_team?.alias : match.away_team_uuid,
          players: isAway ? match.away_team?.players?.map((player: any) => ({
            id: player.player?.id,
            uuid: player.player?.uuid,
            name: player.player?.name,
            nickname: player.player?.nickname,
            city: player.player?.city,
            media_url: player.player?.media_url,
            address: player.player?.address,
            height: player.player?.height,
            phone: player.player?.phoneNumber,
            isVerified: player.player?.isVerified,
            level_uuid: player.player?.level_uuid,
            gender: player.player?.gender,
            username: player.player?.username,
            createdAt: player?.player?.createdAt,
            playstyleForehand: player?.player?.playstyleForehand,
            playstyleBackhand: player?.player?.playstyleBackhand,
            skills: player?.player?.skills ? JSON.parse(player?.player?.skills) : undefined,
          })) : (playerDummy[match?.away_team_uuid || "TBD"] || [])
        },
        court: match?.court_field?.name,
      };

        
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async getMatchesByPlayerUUID(playerUUID: string, statuses?: MatchStatus[]): Promise<Matches[]> {
    
    const matchRepository = AppDataSource.getRepository(Matches);
    const matchesQB = matchRepository
      .createQueryBuilder("match")
      .leftJoin("match.home_team", "homeTeam")
      .leftJoin("match.away_team", "awayTeam")
      .leftJoin("homeTeam.players", "homePlayerTeam")
      .leftJoin("awayTeam.players", "awayPlayerTeam")
      .where(
        new Brackets(qb => {
          qb.where("homePlayerTeam.player_uuid = :playerUUID", { playerUUID })
            .orWhere("awayPlayerTeam.player_uuid = :playerUUID", { playerUUID });
        })
    );
    if (statuses && statuses.length > 0) {
      matchesQB.andWhere("match.status IN (:...statuses)", { statuses });
      
      // Apply special conditions for ENDED status if it's included
      if (statuses.includes(MatchStatus.ENDED)) {
        matchesQB.andWhere("match.away_team_uuid != 'TBD'");
        matchesQB.andWhere("match.away_team_uuid != 'BYE'");
        matchesQB.andWhere("match.home_team_uuid != 'TBD'");
        matchesQB.andWhere("match.home_team_uuid != 'BYE'");
      }
    }
    const matches = await matchesQB.getMany();
    return matches;
  } 

  async playerMatches(req: any, res: any) {
    const utilLib = Util.getInstance();
    const statusParam = req.query.status;
    
    // Handle both single status (string) and multiple statuses (array/string)
    let statuses: MatchStatus[];
    if (Array.isArray(statusParam)) {
      statuses = statusParam as MatchStatus[];
    } else if (typeof statusParam === 'string') {
      // Handle comma-separated statuses or single status
      statuses = statusParam.includes(',') 
        ? (statusParam.split(',') as MatchStatus[])
        : [statusParam as MatchStatus];
    } else {
      statuses = [MatchStatus.ENDED]; // default
    }
    
    const player_uuid = req.params.player_uuid || req.data?.uuid;
    
    try {
      const matches = await this.getMatchesByPlayerUUID(player_uuid, statuses);
      const matchUuids = matches.map((match) => match.uuid);
      
      const matchRepo = AppDataSource.getRepository(Matches);
      let matchHistories = await matchRepo.find({
        where: { uuid: In(matchUuids) },
        relations: {
          away_team: {
            players: {
              player: true
            }
          },
          home_team: {
            players: {
              player: true
            },
          },
          tournament: true,
          court_field: {
            court:true
          }
        }
      });
      matchHistories = matchHistories.map((match) => ({
        ...match,
        court_field: match.court_field ? {
          ...match.court_field,
          name: `${match.court_field?.court?.name} - ${match.court_field?.name}`,
        }: undefined,
      }));
      const result = matchHistories.map((match) => matchSchema.parse(match));
      utilLib.loggingRes(req, { data: result, message: "Matches fetched successfully!" });
      return res.json({ data: result, message: "Matches fetched successfully!" });
    } catch (error: any) {
      console.log(error);
      
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async publicMatchList(req: any, res: any, status?: MatchStatus) {
    const utilLib = Util.getInstance();
    const { tournament_uuid, player, status: statusParam } = req.query;
    try {
      const page = Number.parseInt((req.query.page as string) || "1", 10);
      const limit = Number.parseInt((req.query.limit as string) || "10", 10);
      const player_uuid = player as string;
      let statuses: MatchStatus[];
      if (statusParam) {
        if (Array.isArray(statusParam)) {
          statuses = statusParam as MatchStatus[];
        } else if (typeof statusParam === 'string') {
          // Handle comma-separated statuses or single status
          statuses = statusParam.includes(',') 
            ? (statusParam.split(',') as MatchStatus[])
            : [statusParam as MatchStatus];
        } else {
          statuses = [MatchStatus.ENDED]; // default
        } 
      } else {
        statuses = status ? [status] : []; // default
      }

      if (tournament_uuid) {
        
        const tRepo = AppDataSource.getRepository(Tournament);
        const dataExists = await tRepo.findOneBy({
          uuid: tournament_uuid,
          deletedBy: undefined,
        });
        if (!dataExists) {
          throw new Error("Tournament not found!");
        }
      }
      if (player_uuid) {
        const playerRepo = AppDataSource.getRepository(Player);
        const playerExists = await playerRepo.findOneBy({
          uuid: player_uuid,
          deletedAt: IsNull()
        });
        if (!playerExists) {
          throw new Error("Player not found!");
        }
      }

      const matchesRepo = AppDataSource.getRepository(Matches);
      const queryBuilder = matchesRepo
        .createQueryBuilder("matches")
        .leftJoinAndSelect("matches.home_team", "home")
        .leftJoinAndSelect("matches.away_team", "away")
        .leftJoinAndSelect("away.players", "away_players")
        .leftJoinAndSelect("home.players", "home_players")
        .leftJoinAndSelect("away_players.player", "away_player")
        .leftJoinAndSelect("home_players.player", "home_player")
        .leftJoinAndSelect("matches.court_field", "field")
        .leftJoinAndSelect("field.court", "court")
        .andWhere("matches.deletedAt IS NULL")
        .andWhere("matches.deletedBy IS NULL")
        .andWhere("away_players.deletedBy IS NULL")
        .andWhere("home_players.deletedBy IS NULL")
        .andWhere("matches.deletedBy IS NULL")
        .andWhere("matches.home_team_uuid NOT IN ('TBD', 'BYE')")
        .andWhere("matches.away_team_uuid NOT IN ('TBD', 'BYE')")
        .orderBy("matches.time", "ASC")
        .orderBy("matches.seed_index", "ASC")
        .orderBy("matches.round", "ASC");
      if (page && limit) {
        queryBuilder
          .skip((Number(page) - 1) * Number(limit))
          .take(Number(limit));
      }
      if (tournament_uuid) {
        queryBuilder
          .andWhere("matches.tournament_uuid = :uuid OR (:uuid IS NULL)", {
            uuid: tournament_uuid,
          });
      } else if (tournament_uuid === "") {
        queryBuilder
          .andWhere("matches.tournament_uuid IS NULL OR matches.tournament_uuid = ''");
      }
      if (statuses && statuses.length > 0) {
        queryBuilder
          .andWhere("matches.status IN (:...statuses)", { statuses });
        if (statuses.includes(MatchStatus.UPCOMING)) {
          queryBuilder
            .andWhere("matches.time > NOW()");
        }
      }
      // if status has upcoming, sort time ascending, else sort time desc
      if (statuses.includes(MatchStatus.UPCOMING)) {
        queryBuilder
          .orderBy("matches.time", "ASC");
      } else {
        queryBuilder
          .orderBy("matches.time", "DESC");
      }

      const [data, totalRecords] = await queryBuilder.getManyAndCount();
      const result = data.map((match: any) => {
        const isHome = !["TBD", "BYE"].includes(match.home_team_uuid);
        const isAway = !["TBD", "BYE"].includes(match.away_team_uuid);
        
        return {
          ...match,
          date: match.time,
          with_ad: !!match.with_ad,
          category: match.category,
          home_team: {
            id: isHome ? match.home_team?.id : Number(match.round+''+match.seed_index),
            uuid: isHome ?  match.home_team?.uuid : match.home_team_uuid,
            name: isHome ? match.home_team.name : match.home_team_uuid,
            alias: isHome ? match.home_team.alias : match.home_team_uuid,
            players: isHome ? match.home_team.players.map((player: any) => ({
              id: player.player?.id,
              uuid: player.player?.uuid,
              name: player.player?.name,
              nickname: player.player?.nickname,
              city: player.player?.city,
              media_url: player.player?.media_url,
              address: player.player?.address,
              phone: player.player?.phoneNumber,
              isVerified: player.player?.isVerified,
              level_uuid: player.player?.level_uuid,
              gender: player.player?.gender,
              username: player.player?.username,
              createdAt: player?.player?.createdAt,
              playstyleForehand: player?.player?.playstyleForehand,
              playstyleBackhand: player?.player?.playstyleBackhand
            })) : (playerDummy[match?.home_team_uuid || "TBD"] || [])
          },
          away_team: {
            id: isAway ? match.away_team?.id : Number(match.round+''+match.seed_index),
            uuid: isAway ?  match.away_team?.uuid : match.away_team_uuid,
            name: isAway ? match.away_team.name : match.away_team_uuid,
            alias: isAway ? match.away_team.alias : match.away_team_uuid,
            players: isAway ? match.away_team.players.map((player: any) => ({
              id: player.player?.id,
              uuid: player.player?.uuid,
              name: player.player?.name,
              nickname: player.player?.nickname,
              city: player.player?.city,
              media_url: player.player?.media_url,
              address: player.player?.address,
              phone: player.player?.phoneNumber,
              isVerified: player.player?.isVerified,
              level_uuid: player.player?.level_uuid,
              gender: player.player?.gender,
              username: player.player?.username,
              createdAt: player?.player?.createdAt,
              playstyleForehand: player?.player?.playstyleForehand,
              playstyleBackhand: player?.player?.playstyleBackhand
            })) : (playerDummy[match?.away_team_uuid || "TBD"] || [])
          },
          court: match.tournament_uuid ? match.court_field.name : `${match.court_field?.court?.name || ""} - ${match.court_field.name}`,
        };
      });

      utilLib.loggingRes(req, { data: result, totalRecords, currentPage: Number(page || "1"), totalPages: Math.ceil(totalRecords / Number(limit || "10")) });
      return res.json({
        data: result,
        totalRecords,
        currentPage: Number(page || "1"),
        totalPages: Math.ceil(totalRecords / Number(limit || "10")),
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async publicMatchDetail(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const matchesRepo = AppDataSource.getRepository(Matches);
      const matchAvailable = await matchesRepo.findOneBy({ uuid, deletedAt: IsNull() });
      if (!matchAvailable) throw new Error(`Match doesn't exists`);

      const qbuilder = matchesRepo
        .createQueryBuilder("matches")
        .leftJoinAndSelect("matches.home_team", "home")
        .leftJoinAndSelect("matches.away_team", "away")
        .leftJoinAndSelect("matches.winner", "winner_team")
        .leftJoinAndSelect("away.players", "away_players")
        .leftJoinAndSelect("home.players", "home_players")
        .leftJoinAndSelect("away_players.player", "away_player")
        .leftJoinAndSelect("home_players.player", "home_player")
        .leftJoinAndSelect("matches.court_field", "court_field")
        .leftJoinAndSelect("court_field.court", "court")
        .leftJoinAndSelect("matches.sets", "set")
        .leftJoinAndSelect("matches.player_kudos", "player_kudos")
        .leftJoinAndSelect("player_kudos.kudos", "kudos")
        .leftJoinAndSelect("player_kudos.by", "by")
        .leftJoinAndSelect("set.setLogs", "setLogs")
        .leftJoinAndSelect("matches.matchHistories", "matchHistory")
        .andWhere("matches.deletedAt IS NULL")
        .andWhere("matches.deletedBy IS NULL")
        .andWhere("away_players.deletedBy IS NULL")
        .andWhere("home_players.deletedBy IS NULL")
        .andWhere("matches.uuid = :uuid", { uuid })
      if (!matchAvailable.tournament_uuid && matchAvailable.point_config_uuid) {
        qbuilder
          .leftJoinAndSelect("matches.point_config", "point_config")
          .leftJoinAndSelect("point_config.points", "points")
          .andWhere("points.round = matches.round");
      }
      const match  = await qbuilder.getOne();
      if (!match) throw new Error(`Data not found`);
      

      const isHome = !["TBD", "BYE"].includes(match.home_team_uuid);
      const isAway = !["TBD", "BYE"].includes(match.away_team_uuid);
      const data = {
        ...match,
        date: match.time,
        with_ad: !!match.with_ad,
        home_team: {
          id: isHome ? match.home_team?.id : Number(match.round+''+match.seed_index),
          uuid: isHome ?  match.home_team?.uuid : match.home_team_uuid,
          name: isHome ? match.home_team?.name : match.home_team_uuid,
          alias: isHome ? match.home_team?.alias : match.home_team_uuid,
          players: isHome ? match.home_team?.players?.map((player: any) => ({
            id: player.player?.id,
            uuid: player.player?.uuid,
            name: player.player?.name,
            nickname: player.player?.nickname,
            city: player.player?.city,
            media_url: player.player?.media_url,
            address: player.player?.address,
            height: player.player?.height,
            phone: player.player?.phoneNumber,
            isVerified: player.player?.isVerified,
            level_uuid: player.player?.level_uuid,
            gender: player.player?.gender,
            username: player.player?.username,
            createdAt: player?.player?.createdAt,
            playstyleForehand: player?.player?.playstyleForehand,
            playstyleBackhand: player?.player?.playstyleBackhand,
            skills: player?.player?.skills ? JSON.parse(player?.player?.skills) : undefined,
          })) : (playerDummy[match?.home_team_uuid || "TBD"] || [])
        },
        away_team: {
          id: isAway ? match.away_team?.id : Number(match.round+''+match.seed_index),
          uuid: isAway ?  match.away_team?.uuid : match.away_team_uuid,
          name: isAway ? match.away_team?.name : match.away_team_uuid,
          alias: isAway ? match.away_team?.alias : match.away_team_uuid,
          players: isAway ? match.away_team?.players?.map((player: any) => ({
            id: player.player?.id,
            uuid: player.player?.uuid,
            name: player.player?.name,
            nickname: player.player?.nickname,
            city: player.player?.city,
            media_url: player.player?.media_url,
            address: player.player?.address,
            height: player.player?.height,
            phone: player.player?.phoneNumber,
            isVerified: player.player?.isVerified,
            level_uuid: player.player?.level_uuid,
            gender: player.player?.gender,
            username: player.player?.username,
            createdAt: player?.player?.createdAt,
            playstyleForehand: player?.player?.playstyleForehand,
            playstyleBackhand: player?.player?.playstyleBackhand,
            skills: player?.player?.skills ? JSON.parse(player?.player?.skills) : undefined,
          })) : (playerDummy[match?.away_team_uuid || "TBD"] || [])
        },
        court: match?.court_field?.name,
        player_kudos: match?.player_kudos?.map((player_kudos: any) => ({
          ...player_kudos,
          kudos: player_kudos.kudos?.name,
          by: player_kudos.by?.name,
        })),
      };

        
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async publicTournamentMatchList(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { tournament_uuid } = req.params;
    const { page, limit } = req.query;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: undefined,
      });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }

      const matchesRepo = AppDataSource.getRepository(Matches);
      const queryBuilder = matchesRepo
        .createQueryBuilder("matches")
        .leftJoinAndSelect("matches.home_team", "home")
        .leftJoinAndSelect("matches.away_team", "away")
        .leftJoinAndSelect("away.players", "away_players")
        .leftJoinAndSelect("home.players", "home_players")
        .leftJoinAndSelect("away_players.player", "away_player")
        .leftJoinAndSelect("home_players.player", "home_player")
        .leftJoinAndSelect("matches.court_field", "field")
        .leftJoinAndSelect("field.court", "court")
        .andWhere("matches.deletedAt IS NULL")
        .andWhere("matches.deletedBy IS NULL")
        .andWhere("away_players.deletedBy IS NULL")
        .andWhere("home_players.deletedBy IS NULL")
        .orderBy("matches.seed_index", "ASC")
        .orderBy("matches.round", "ASC");
      if (page && limit) {
        queryBuilder
          .skip((Number(page) - 1) * Number(limit))
          .take(Number(limit));
      }
      if (tournament_uuid) {
        queryBuilder
          .andWhere("matches.tournament_uuid = :uuid OR (:uuid IS NULL)", {
            uuid: tournament_uuid,
          });
      } else {
        queryBuilder
          .andWhere("matches.tournament_uuid IS NULL OR matches.tournament_uuid = ''");
      }
      const [data, totalRecords] = await queryBuilder.getManyAndCount();
      
      const result = data.map((match: any) => {
        const isHome = !["TBD", "BYE"].includes(match.home_team_uuid);
        const isAway = !["TBD", "BYE"].includes(match.away_team_uuid);
        return {
          ...match,
          date: match.time,
          with_ad: !!match.with_ad,
          home_team: {
            id: isHome ? match.home_team?.id : Number(match.round+''+match.seed_index),
            uuid: isHome ?  match.home_team?.uuid : match.home_team_uuid,
            name: isHome ? match.home_team.name : match.home_team_uuid,
            alias: isHome ? match.home_team.alias : match.home_team_uuid,
            players: isHome ? match.home_team.players.map((player: any) => ({
              id: player.player?.id,
              uuid: player.player?.uuid,
              name: player.player?.name,
              nickname: player.player?.nickname,
              city: player.player?.city,
              media_url: player.player?.media_url,
              address: player.player?.address,
              phone: player.player?.phoneNumber,
              isVerified: player.player?.isVerified,
              level_uuid: player.player?.level_uuid,
              gender: player.player?.gender,
              username: player.player?.username,
              createdAt: player?.player?.createdAt,
              playstyleForehand: player?.player?.playstyleForehand,
              playstyleBackhand: player?.player?.playstyleBackhand
            })) : (playerDummy[match?.home_team_uuid || "TBD"] || [])
          },
          away_team: {
            id: isAway ? match.away_team?.id : Number(match.round+''+match.seed_index),
            uuid: isAway ?  match.away_team?.uuid : match.away_team_uuid,
            name: isAway ? match.away_team.name : match.away_team_uuid,
            alias: isAway ? match.away_team.alias : match.away_team_uuid,
            players: isAway ? match.away_team.players.map((player: any) => ({
              id: player.player?.id,
              uuid: player.player?.uuid,
              name: player.player?.name,
              nickname: player.player?.nickname,
              city: player.player?.city,
              media_url: player.player?.media_url,
              address: player.player?.address,
              phone: player.player?.phoneNumber,
              isVerified: player.player?.isVerified,
              level_uuid: player.player?.level_uuid,
              gender: player.player?.gender,
              username: player.player?.username,
              createdAt: player?.player?.createdAt,
              playstyleForehand: player?.player?.playstyleForehand,
              playstyleBackhand: player?.player?.playstyleBackhand
            })) : (playerDummy[match?.away_team_uuid || "TBD"] || [])
          },
          court: match.tournament_uuid ? match.court_field.name : `${match.court_field?.court?.name || ""} - ${match.court_field.name}`,
        };
      });

      utilLib.loggingRes(req, { data: result, totalRecords, currentPage: Number(page || "1"), totalPages: Math.ceil(totalRecords / Number(limit || "10")) });
      return res.json({
        data: result,
        totalRecords,
        currentPage: Number(page || "1"),
        totalPages: Math.ceil(totalRecords / Number(limit || "10")),
        
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async publicTournamentGroup(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { tournament_uuid } = req.params;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
          deletedBy: undefined,
        });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }
      const teamRepo = AppDataSource.getRepository(Team);
      const tournamentGroupRepo = AppDataSource.getRepository(TournamentGroup);
      
      // Get all teams for this tournament
      const teams = await teamRepo.find({
        where: {
          tournament_uuid: tournament_uuid,
          deletedAt: IsNull(),
        },
      });
      
      // Get all groups for this tournament
      const groups = await tournamentGroupRepo.find({
        where: {
          tournament_uuid: tournament_uuid,
          deletedAt: IsNull(),
        },
        relations: {
          teams: {
            players: {
              player: true
            }
          },
        },
      });
      
      const groupedDatas  = groups.map(gd => ({
        ...gd,
        teams: gd.teams?.map(gdt => ({
          ...gdt,
          players: gdt.players?.map(gdp => ({
            ...gdp.player,
          })) || []
        })) || [] 
      }));
      console.log(JSON.stringify(groupedDatas));
      
      // Group teams by group_uuid
      const groupedData  = groups.map(gd => groupResponseSchema.parse({
        ...gd,
        teams: gd.teams?.map(gdt => ({
          ...gdt,
          players: gdt.players?.map(gdp => ({
            ...gdp.player,
          })) || []
        })) || [] 
      }));
      
      utilLib.loggingRes(req, { data: groupedDatas, message: "Tournament groups fetched successfully" });
      return res.json({ data: groupedData, message: "Tournament groups fetched successfully" });
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    } 
  } 
}

