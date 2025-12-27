import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { Brackets, In, IsNull } from "typeorm";

import { AppDataSource } from "../data-source";
import { Tournament, typeTournamentEnum } from "../entities/Tournament";
import { Team } from "../entities/Team";
import { Game } from "../entities/Game";
import { SetLog } from "../entities/SetLog";
import { Matches, MatchStatus } from "../entities/Matches";
import RedisLib from "../lib/redis.lib";
import { TournamentMatchPoint } from "../entities/TournamentMatchPoint";
import { MatchPoint } from "../entities/MatchPoint";
import { Player } from "../entities/Player";
import { PlayerMatchPoint } from "../entities/PlayerPoint";
import { playerDummy } from "../lib/fake.lib";
import { PointConfig } from "../entities/PointConfig";
import { MatchHistories, MatchHistoryType } from "../entities/MatchHistories";
import { PlayerTeam } from "../entities/PlayerTeam";
import { matchSchema } from "../schemas/tournament.schema";
import { CoinLogs, CoinSourceEnum, CoinStatusEnum } from "../entities/CoinLogs";
import { PointLogs, PointSourceEnum, PointStatusEnum } from "../entities/PointLogs";

export default class MatchController {
  constructor() {
    this.getMatchesByPlayerUUID = this.getMatchesByPlayerUUID.bind(this);
    this.playerMatches = this.playerMatches.bind(this);
  }
  async create(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { tournament_uuid, home_team_uuid, away_team_uuid, round } = req.body;
    try {
      if (!tournament_uuid || !home_team_uuid || !away_team_uuid || !round) {
        throw new Error("All fields are required!");
      }

      // check Exist
      const teams = [
        { uuid: home_team_uuid, corner: "home" },
        { uuid: away_team_uuid, corner: "away" },
      ];
      const teamRepo = AppDataSource.getRepository(Team);
      for (const p of teams) {
        const dataExists = await teamRepo.findOneBy({ uuid: p.uuid });
        if (!dataExists) {
          throw new Error("Team UUID not found!");
        }
      }

      // check tournament_uuid exists
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: undefined,
      });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }
      const matchesRepo = AppDataSource.getRepository(Matches);
      const newData = new Matches();
      newData.uuid = uuidv4();
      newData.tournament_uuid = tournament_uuid;
      newData.home_team_uuid = home_team_uuid;
      newData.away_team_uuid = away_team_uuid;
      newData.round = round;
      newData.createdBy = req.data?.uuid || undefined;
      const data = await matchesRepo.save(newData);

      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      console.log(error);

      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async createMultiple(req: any, res: any) {
    const redisLib = RedisLib.getInstance();
    const utilLib = Util.getInstance();
    const { tournament_uuid, matches } = req.body;
    try {
      // check tournament_uuid exists
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: IsNull(),
      });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }
      await AppDataSource.transaction(async (entityManager) => {
        // check tournament_uuid exists in redis
        const exist = await redisLib.redisget(`tournament-${tournament_uuid}`);
        if (exist) {
          throw new Error("Tournament already created");
        }

        // check Team Matches Exists
        const teamRepo = AppDataSource.getRepository(Team);
        for (const m of matches) {
          if (!m.home_team_uuid || !m.away_team_uuid || !m.round)
            throw new Error("All fields are required!");
          if (!["BYE", "TBD"].includes(m.home_team_uuid)) {
            const homeTeam = await teamRepo.findOneBy({
              uuid: m.home_team_uuid,
              deletedBy: undefined,
            });
            if (!homeTeam) throw new Error("Team uuid not found!");
          }
          if (!["BYE", "TBD"].includes(m.away_team_uuid)) {
            const awayTeam = await teamRepo.findOneBy({
              uuid: m.away_team_uuid,
              deletedBy: undefined,
            });
            if (!awayTeam) throw new Error("Team uuid not found!");
          }
        }
        let round = 1;
        let seedIndex = 1;
        // save
        const newData = matches.map((m: any) => {
          if (Number(m.round) !== round) {
            round = Number(m.round);
            seedIndex = 1;
          }
          const newMatch = new Matches();
          newMatch.uuid = uuidv4();
          newMatch.tournament_uuid = tournament_uuid;
          newMatch.home_team_uuid = m.home_team_uuid;
          newMatch.away_team_uuid = m.away_team_uuid;
          newMatch.court_field_uuid = m.court_field_uuid;
          newMatch.status = m.status;
          newMatch.time = m.date ? new Date(m.date) : undefined;
          newMatch.round = round;;
          newMatch.seed_index = seedIndex;;
          newMatch.createdBy = req.data?.uuid || undefined;
          seedIndex++;
          return newMatch;
        });

        const data = await entityManager.save(newData);
        if (data.length > 0) {
          redisLib.redisset(`tournament-${tournament_uuid}`, true);
        }
        utilLib.loggingRes(req, { data });
        return res.json({ data });
        
      });
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async updateMultiple(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { tournament_uuid, matches } = req.body;
    try {
      if (!tournament_uuid || !matches) {
        throw new Error("All fields are required!");
      }
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: IsNull(),
      });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }
      const result:{
        data: any[];
        updatedRecords: number;
        messages: string;
      } = {
        data: [],
        updatedRecords: 0,
        messages: "Sucess"
      }
      // transactional appdatasource create transaction
      await AppDataSource.transaction(async (entityManager) => {
        // Get all existing matches for this tournament
        const existingMatches = await entityManager.find(Matches, {
          where: {
            tournament_uuid: tournament_uuid,
            deletedBy: IsNull(),
          },
        });

        // Create Set of payload UUIDs for fast lookup
        const payloadUuids = new Set(matches.map((m: any) => m.uuid).filter(Boolean));

        // Soft delete matches that are not in payload
        let deletedCount = 0;
        for (const existingMatch of existingMatches) {
          if (!payloadUuids.has(existingMatch.uuid)) {
            existingMatch.deletedBy = req.data?.uuid || undefined;
            existingMatch.deletedAt = new Date();
            await entityManager.save(existingMatch);
            deletedCount++;
          }
        }

        if (deletedCount > 0) {
          utilLib.loggingRes(req, { 
            message: `Soft deleted ${deletedCount} matches that are not in payload`
          });
        }
        
        let index = 1;
        for (const m of matches) {
          if (!m.uuid) {
            
            const newMatch = new Matches();
            newMatch.uuid = uuidv4();
            newMatch.tournament_uuid = tournament_uuid;
            newMatch.home_team_uuid = m.home_team_uuid;
            newMatch.away_team_uuid = m.away_team_uuid;
            newMatch.court_field_uuid = m.court_field_uuid;
            newMatch.status = m.status;
            newMatch.time = m.time ? new Date(m.time) : undefined;
            newMatch.round = m.round;
            newMatch.tournament_group_index = m.group;
            newMatch.seed_index = m.seed_index || null;
            newMatch.home_group_index = m.home_group_index;
            newMatch.home_group_position = m.home_group_position;
            newMatch.away_group_index = m.away_group_index;
            newMatch.away_group_position = m.away_group_position;
            newMatch.createdBy = req.data?.uuid || undefined;
            await entityManager.save(newMatch);
            result.data.push(newMatch);
            result.updatedRecords++;
          } else {
            // Use entityManager for consistency within transaction
            const dataExists = await entityManager.findOne(Matches, {
              where: {
                uuid: m.uuid,
                deletedBy: IsNull(),
              },
            });
            if (dataExists) {

              dataExists.home_team_uuid = m.home_team_uuid;
              dataExists.away_team_uuid = m.away_team_uuid;
              dataExists.court_field_uuid = m.court_field_uuid;
              dataExists.status = m.status;
              dataExists.time = m.time ? new Date(m.time) : undefined;
              dataExists.round = m.round;
              dataExists.tournament_group_index = m.group;
              dataExists.home_group_index = m.home_group_index;
              dataExists.home_group_position = m.home_group_position;
              dataExists.away_group_index = m.away_group_index;
              dataExists.away_group_position = m.away_group_position;
              dataExists.seed_index = m.seed_index || null;
              await entityManager.save(dataExists);
              result.data.push(dataExists);
              result.updatedRecords++;
            } else {

              const newMatch = new Matches();
              newMatch.uuid = uuidv4();
              newMatch.tournament_uuid = tournament_uuid;
              newMatch.home_team_uuid = m.home_team_uuid;
              newMatch.away_team_uuid = m.away_team_uuid;
              newMatch.court_field_uuid = m.court_field_uuid;
              newMatch.status = m.status;
              newMatch.time = m.time ? new Date(m.time) : undefined;
              newMatch.round = m.round;
              newMatch.tournament_group_index = m.group;
              newMatch.seed_index = m.seed_index || index;
              newMatch.home_group_index = m.home_group_index;
              newMatch.home_group_position = m.home_group_position;
              newMatch.away_group_index = m.away_group_index;
              newMatch.away_group_position = m.away_group_position;
              newMatch.seed_index = m.seed_index || null;
              newMatch.createdBy = req.data?.uuid || undefined;
              await entityManager.save(newMatch);
              result.data.push(newMatch);
              result.updatedRecords++;
            }
          }
          index++
        }
        utilLib.loggingRes(req, result);
        return res.json(result);
      }); 
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async createMultipleCustom(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { matches } = req.body;
    try {
      if (!matches) {
        throw new Error("Matches are required!");
      }
      const matchesRepo = AppDataSource.getRepository(Matches);
      for (const m of matches) {
        if (!m.date || !m.court_field_uuid || !m.point_config_uuid || !m.home_team || !m.away_team) {
          return res.status(400).json({ message: "Date, Court Field, Point Config, Home Team, and Away Team are required!" });
        }
        const existingMatch = await matchesRepo.findOne({
          where: {
            time: m.date ? new Date(m.date) : undefined,
            court_field_uuid: m.court_field_uuid,
            deletedBy: IsNull(),
          },
          relations: {
            court_field: {
              court:true
            }
          }
        });
        if (existingMatch) {
          throw new Error(`Match already exists on ${existingMatch.court_field?.court?.name} - ${existingMatch.court_field?.name} at ${new Date(m.date)}!`);
        }
      }
      const result:{
        data: any[];
        updatedRecords: number;
        message: string;
      } = {
        data: [],
        updatedRecords: 0,
        message: "Sucess"
      }
      // transactional appdatasource create transaction
      await AppDataSource.transaction(async (entityManager) => {
        // create teams from matches[index].home_team and matches[index].away_team
        const homeTeams: Team[] = [];
        const awayTeams: Team[] = [];
        const homeTeamPlayers: PlayerTeam[] = [];
        const awayTeamPlayers: PlayerTeam[] = [];
        const matchesToAdd: Matches[] = [];
        for (const m of matches) {
          const homeTeam = new Team();
          homeTeam.uuid = uuidv4();
          homeTeam.name = m.home_team.name;
          homeTeam.alias = m.home_team.alias;
          homeTeam.createdBy = req.data?.uuid || undefined;
          homeTeams.push(homeTeam);

          const awayTeam = new Team();
          awayTeam.uuid = uuidv4();
          awayTeam.name = m.away_team.name;
          awayTeam.alias = m.away_team.alias;
          awayTeam.createdBy = req.data?.uuid || undefined;
          awayTeams.push(awayTeam);

          for (const htp of m.home_team.players) {
            const homeTeamPlayer = new PlayerTeam();
            homeTeamPlayer.uuid = uuidv4();
            homeTeamPlayer.team_uuid = homeTeam.uuid;
            homeTeamPlayer.player_uuid = htp.uuid;
            homeTeamPlayer.createdBy = req.data?.uuid || undefined;
            homeTeamPlayers.push(homeTeamPlayer);
          }

          for (const atp of m.away_team.players) {
            const awayTeamPlayer = new PlayerTeam();
            awayTeamPlayer.uuid = uuidv4();
            awayTeamPlayer.team_uuid = awayTeam.uuid;
            awayTeamPlayer.player_uuid = atp.uuid;
            awayTeamPlayer.createdBy = req.data?.uuid || undefined;
            awayTeamPlayers.push(awayTeamPlayer);
          }

          const newMatch = new Matches();
          newMatch.uuid = uuidv4();
          newMatch.point_config_uuid = m.point_config_uuid;
          newMatch.home_team_uuid = homeTeam.uuid;
          newMatch.away_team_uuid = awayTeam.uuid;
          newMatch.court_field_uuid = m.court_field_uuid;
          newMatch.status = m.status;
          newMatch.time = m.date ? new Date(m.date) : undefined;
          newMatch.with_ad = m.with_ad;
          newMatch.round = 1;
          newMatch.seed_index = m.seed_index;
          newMatch.createdBy = req.data?.uuid || undefined;
          matchesToAdd.push(newMatch);
          result.data.push(newMatch);
          result.updatedRecords++;
        }
        await entityManager.save(homeTeams);
        await entityManager.save(awayTeams);
        await entityManager.save(homeTeamPlayers);
        await entityManager.save(awayTeamPlayers);
        await entityManager.save(matchesToAdd);
        utilLib.loggingRes(req, result);
        return res.json(result);
      });
      
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async updateCustom(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid, home_team, away_team, home_team_uuid, away_team_uuid, point_config_uuid, date, court_field_uuid } = req.body;
    try {
      
      if (!uuid || !home_team || !away_team || !home_team_uuid || !away_team_uuid || !point_config_uuid) {
        return res.status(400).json({ message: "Match UUID, Home Team, Away Team, and Point Config are required!" });
      }
      const matchesRepo = AppDataSource.getRepository(Matches);
      await AppDataSource.transaction(async (entityManager) => {
        const teamPLayersRepo = AppDataSource.getRepository(PlayerTeam);
        const homeTeamPlayers = await teamPLayersRepo.findBy({
            team_uuid: home_team_uuid,
            deletedAt: IsNull()
        });
        
        if (!homeTeamPlayers?.length) {
          throw new Error("Home Team Player not found!");
        } else {
          let i = 0;
          for (const hp of homeTeamPlayers) {
            hp.player_uuid = home_team.players[i].uuid;
            await entityManager.save(hp);
            i++;
          }
        }
        const awayTeamPlayers = await teamPLayersRepo.findBy({
          team_uuid: away_team_uuid,
          deletedAt: IsNull()
        });
        
        if (!awayTeamPlayers?.length) {
          throw new Error("Away Team Player not found!");
        } else {
          let i = 0;
          for (const ap of awayTeamPlayers) {
            ap.player_uuid = away_team.players[i].uuid;
            await entityManager.save(ap);
            i++;
          }
        }
        //     deletedAt: IsNull()
        //   });
        //   if (!teamPlayers?.length) {
        //     throw new Error("Team Player not found!");
        //   } else {
        //     for (const hp of teamPlayers) {
        //       console.log("\n\n");
        //       console.log(htp);
        //       console.log(hp);
        //       console.log("\n\n");
        //       hp.player_uuid = htp.player_uuid;
        //       await entityManager.save(hp);
        //     }
        //   }
        // }
        // for (const atp of away_team.players) {
        //   const teamPlayers = await teamPLayersRepo.findBy({
        //     team_uuid: away_team_uuid,
        //     deletedAt: IsNull()
        //   });
        //   if (!teamPlayers?.length) {
        //     throw new Error("Team Player not found!");
        //   } else {
        //     for (const ap of teamPlayers) {
        //       ap.player_uuid = atp.player_uuid;
        //       await entityManager.save(ap);
        //     }
        //   }
        // }
        const dataExists = await matchesRepo.findOneBy({
          uuid: uuid,
          deletedBy: IsNull(),
        });
        if (!dataExists) {
          throw new Error("Match not found!");
        }
        dataExists.point_config_uuid = point_config_uuid || point_config_uuid;
        dataExists.time = date ? new Date(date) : dataExists.time;
        dataExists.court_field_uuid = court_field_uuid || dataExists.court_field_uuid;
        await entityManager.save(dataExists);
        utilLib.loggingRes(req, {data:dataExists, message:"Match updated successfully!"});
        return res.json({data:dataExists, message:"Match updated successfully!"});
      });
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
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

      const qbuilder = await matchesRepo
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

  async updateScore(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { home_team_score, away_team_score, game_scores, notes, status, player_uuid } = req.body;
    try {
      if ((!home_team_score && home_team_score !== 0) || (!away_team_score && away_team_score !== 0)) {
        throw new Error("All fields are required!");
      }
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        // check Exist
        const matchesRepo = AppDataSource.getRepository(Matches);
        const data = await matchesRepo.findOne({
          where: { uuid },
          relations: {
            home_team: {
              players: true
            },
            away_team: {
              players: true
            },
          }
        });
        if (!data) {
          throw new Error("Match not found!");
        }
        if (data.status == MatchStatus.ENDED) {
          throw new Error("Match already ended!");
        }
        data.home_team_score = home_team_score;
        data.away_team_score = away_team_score;
        data.game_scores = game_scores ? game_scores : data.game_scores
        if (home_team_score >= 6) {
          data.winner_team_uuid = data.home_team_uuid;
          data.status = MatchStatus.ENDED;
        } else if (away_team_score >= 6) {
          data.winner_team_uuid = data.away_team_uuid;
          data.status = MatchStatus.ENDED;
        }
        await transactionalEntityManager.save(data);

        if (data.status == MatchStatus.ENDED) {
          // BEGIN: set player point
          let rewardPoint: MatchPoint | undefined = undefined;
          if (data.tournament_uuid) {
            const tournamentRepo = AppDataSource.getRepository(Tournament);
            const point = await tournamentRepo.findOne({
              select: ["point_config", "point_config"],
              where: {
                uuid: data.tournament_uuid, point_config: { points: { round: data.round } }
              },
              relations: ["point_config", "point_config.points"]
            });
            if (point?.type === typeTournamentEnum.KNOCKOUT) {

              // BEGIN: update next match
              // check if this match is a knockout tournament match
              const nextSeed = utilLib.getNextSeed({ round: data.round, seedIndex: data.seed_index || 0 });
              const nextMatch = await matchesRepo.findOne({
                where: {
                  tournament_uuid: data.tournament_uuid,
                  round: nextSeed.round,
                  seed_index: nextSeed.seedIndex
                }
              });
              if (nextMatch) {
                if (nextSeed.teamPosition == "home") {
                  nextMatch.home_team_uuid = data.winner_team_uuid;
                } else {
                  nextMatch.away_team_uuid = data.winner_team_uuid;
                }
                nextMatch.status =
                  !["TBD", "BYE"].includes((!!nextMatch.home_team_uuid ? nextMatch.home_team_uuid : "TBD")) &&
                  !["TBD", "BYE"].includes((!!nextMatch.away_team_uuid ? nextMatch.away_team_uuid : "TBD"))
                    ? MatchStatus.ONGOING : MatchStatus.UPCOMING;
                await transactionalEntityManager.save(nextMatch);
              }
            // END: update next match
              
            }
            rewardPoint = !!point?.point_config?.points?.length ? point.point_config.points[0] : undefined;
          } else {
            const pointConfigRepo = AppDataSource.getRepository(PointConfig);
            const point = await pointConfigRepo.findOne({
              select: ["points", "points"],
              where: {
                uuid: data.point_config_uuid,
                points: {
                  round: 1
                }
              },
              relations: ["points"]
            });
            rewardPoint = !!point?.points?.length ? point.points[0] : undefined;
          }
          if (rewardPoint) {
            const matchTeam = await matchesRepo.findOne({
              where: {
                uuid: data.uuid},
              relations: ["home_team", "away_team", "home_team.players", "away_team.players"]
            });
            if (!matchTeam?.home_team?.players || !matchTeam?.away_team?.players) {
              throw new Error("Home team or Away team players not found!");
            }
            
            const playerPoints: { uuid: string; point: number }[] = [];
            for (const player of matchTeam?.home_team?.players) {
              const playerPointHome = new PlayerMatchPoint();
              playerPointHome.uuid = uuidv4();
              playerPointHome.round = rewardPoint.round;
              playerPointHome.player_uuid = player?.player_uuid || "";
              playerPointHome.point = data?.winner_team_uuid == data?.home_team_uuid ? rewardPoint.win_point : rewardPoint.lose_point;
              playerPointHome.round = data?.round || 0;
              playerPointHome.tournament_uuid = data?.tournament_uuid || "";
              playerPointHome.match_uuid = data?.uuid || "";
              playerPointHome.tournament_match_point_uuid = rewardPoint.uuid || "";
              playerPointHome.createdBy = req.data?.uuid || undefined;
              await transactionalEntityManager.save(playerPointHome);
              playerPoints.push({ uuid: player?.player_uuid || "", point: playerPointHome.point });
            }
            for (const player of matchTeam?.away_team?.players) {
              const playerPointAway = new PlayerMatchPoint();
              playerPointAway.uuid = uuidv4();
              playerPointAway.round = rewardPoint.round;
              playerPointAway.player_uuid = player?.player_uuid || "";
              playerPointAway.point = data?.winner_team_uuid == data?.away_team_uuid ? rewardPoint.win_point : rewardPoint.lose_point;
              playerPointAway.round = data?.round || 0;
              playerPointAway.tournament_uuid = data?.tournament_uuid || "";
              playerPointAway.match_uuid = data?.uuid || "";
              playerPointAway.tournament_match_point_uuid = rewardPoint.uuid || "";
              playerPointAway.createdBy = req.data?.uuid || undefined;
              await transactionalEntityManager.save(playerPointAway);
              playerPoints.push({ uuid: player?.player_uuid || "", point: playerPointAway.point });
            }
            

            const playerRepo = AppDataSource.getRepository(Player);
            for (const playerPoint of playerPoints) {
              const player = await playerRepo.findOneBy({ uuid: playerPoint.uuid });
              
              if (!player) {
                throw new Error("Player not found!");
              }
              player.point = player.point + playerPoint.point;
              await transactionalEntityManager.save(player);
            }
          }
          // END: set player point
        }
        if ((status == MatchHistoryType.INJURY || status == MatchHistoryType.NO_SHOW || status == MatchHistoryType.OTHERS) && player_uuid) {
          const teamUuid = data?.away_team?.players?.find((player) => player.player_uuid === player_uuid)?.team_uuid || data?.home_team?.players?.find((player) => player.player_uuid === player_uuid)?.team_uuid || undefined;
          if (player_uuid.includes("BOTH")) {
            const players = []
            if (player_uuid.includes("HOME")) {
              for (const pl of data?.home_team?.players || []) {
                players.push(pl)
              }
            }
            if (player_uuid.includes("AWAY")) {
              for (const pl of data?.away_team?.players || []) {
                players.push(pl)
              }
            }
            for (const pl of players) {
              const matchHistory = new MatchHistories();
              matchHistory.uuid = uuidv4();
              matchHistory.match_uuid = uuid;
              matchHistory.notes = notes;
              matchHistory.type = status;
              matchHistory.player_uuid = pl.player_uuid || "";
              if (game_scores?.length) {
                matchHistory.set = game_scores.length;
              }
              if (teamUuid) {
                matchHistory.team_uuid = teamUuid;
              }
              matchHistory.createdBy = req.data?.uuid || undefined;
              await transactionalEntityManager.save(matchHistory);
            }
          } else {
            const matchHistory = new MatchHistories();
            matchHistory.uuid = uuidv4();
            matchHistory.match_uuid = uuid;
            matchHistory.type = status;
            matchHistory.notes = notes;
            matchHistory.player_uuid = player_uuid;
            if (game_scores?.length) {
              matchHistory.set = game_scores.length;
            }
            if (teamUuid) {
              matchHistory.team_uuid = teamUuid;
            }
            matchHistory.createdBy = req.data?.uuid || undefined;
            await transactionalEntityManager.save(matchHistory);
          }
        }
        
        utilLib.loggingRes(req, { data, message: "Match updated successfully!" });
        return res.json({ data, message: "Match updated successfully!" });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async updateVideoURL(req:any, res:any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { video_url } = req.body;
    try {
      if (!video_url) {
        throw new Error("Video URL is required!");
      }

      const matchesRepo = AppDataSource.getRepository(Matches);
      const data = await matchesRepo.findOneBy({ uuid, deletedAt: IsNull() });
      if (!data) {
        throw new Error("Match not found!");
      }
      data.youtube_url = video_url;
      await matchesRepo.save(data);

      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async endMatch(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { home_team_score, away_team_score, winner_team_uuid } = req.body;
    try {
      if (!home_team_score || !away_team_score || !winner_team_uuid) {
        return res.status(400).json({ message: "All fields are required!" });
      }
      await AppDataSource.transaction(async (entityManager) => {
        // check Exist
        const matchesRepo = AppDataSource.getRepository(Matches);
        const data = await matchesRepo.findOneBy({ uuid });
        if (!data) {
          throw new Error("Match not found!");
        }
        if (data.status == MatchStatus.ENDED) {
          throw new Error("Match already ended!");
        }

        const teamRepo = AppDataSource.getRepository(Team);
        const dataTeam = await teamRepo.findOne({
          where: { uuid: winner_team_uuid },
          relations: [
            "players.player",
            "tournament",
            "home_matches",
            "away_matches",
          ],
        });

        if (!dataTeam) {
          throw new Error("Winner UUID not found!");
        }
        if (
          winner_team_uuid != data.home_team_uuid &&
          winner_team_uuid != data.away_team_uuid
        ) {
          throw new Error(
            "Winner UUID should be home_team_uuid or away_team_uuid!"
          );
        }

        data.home_team_score = home_team_score;
        data.away_team_score = away_team_score;
        data.winner_team_uuid = winner_team_uuid;
        data.status = MatchStatus.ENDED;
        await entityManager.save(data);

        // set player point
        let playerPoint = 0;
        let playerCoin = 0;
        const tmRepo = AppDataSource.getRepository(TournamentMatchPoint);
        const tmData = await tmRepo.findOneBy({
          round: data.round,
          tournament_uuid: data.tournament_uuid,
        });

        let mpUuid = "";
        const mpRepo = AppDataSource.getRepository(MatchPoint);
        const mpData = await mpRepo.findOneBy({
          round: data.round,
        });

        if (tmData) {
          playerPoint = tmData.point;
          playerCoin = tmData.coin;
          mpUuid = tmData.uuid;
        } else if (mpData) {
          playerPoint = mpData.win_point;
          playerCoin = mpData.win_coin;
          mpUuid = mpData.uuid;
        }
        // get Players
        if (dataTeam?.players && (playerPoint > 0 || playerCoin > 0)) {
          const playerRepo = AppDataSource.getRepository(Player);
          dataTeam.players.forEach(async (player: any) => {
            let p : any = await playerRepo.findOneBy({ uuid : player.player_uuid });
            if (p) {
              p.point = p.point + playerPoint;
              p.coin = p.coin + playerCoin;
              entityManager.save(p);
              const newPlayerPoint = new PlayerMatchPoint();
              newPlayerPoint.player_uuid = player.uuid;
              newPlayerPoint.point = playerPoint || 0;
              newPlayerPoint.coin = playerCoin || 0;
              newPlayerPoint.match_uuid = data.uuid;
              newPlayerPoint.tournament_uuid = data.tournament_uuid;
              newPlayerPoint.round = data.round;
              newPlayerPoint.match_point_uuid = mpUuid;
              newPlayerPoint.tournament_match_point_uuid = mpUuid;
              newPlayerPoint.createdBy = req.data?.uuid || undefined;
              await entityManager.save(newPlayerPoint);
              const newCoinLog = new CoinLogs();
              newCoinLog.player_uuid = player.uuid;
              newCoinLog.coin = playerCoin || 0;
              newCoinLog.before = p.coin - playerCoin;
              newCoinLog.after = p.coin;
              newCoinLog.ref_uuid = data.uuid;
              newCoinLog.status = CoinStatusEnum.IN;
              newCoinLog.source = CoinSourceEnum.MATCH;
              newCoinLog.createdBy = req.data?.uuid || undefined;
              await entityManager.save(newCoinLog);
              const newPointLog = new PointLogs();
              newPointLog.player_uuid = player.uuid;
              newPointLog.point = playerPoint || 0;
              newPointLog.before = p.point - playerPoint;
              newPointLog.after = p.point;
              newPointLog.ref_uuid = data.uuid;
              newPointLog.status = PointStatusEnum.IN;
              newPointLog.source = PointSourceEnum.MATCH;
              newPointLog.createdBy = req.data?.uuid || undefined;
              await entityManager.save(newPointLog);
            }
          });
        }
        utilLib.loggingRes(req, { data });
        return res.json({ dataTeam });
        
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async updateMatchStatus(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { status, notes } = req.body;
    try {
      if (!status) {
        throw new Error("Status is required!");
      }
      await AppDataSource.transaction(async (entityManager) => {
        const matchesRepo = AppDataSource.getRepository(Matches);
        const data = await matchesRepo.findOneBy({ uuid });
        if (!data) {
          throw new Error("Match not found!");
        }
        const oldStatus = data.status;
        data.status = status;
        data.notes = notes || undefined;
        await entityManager.save(data);
        const newMatchHistory = new MatchHistories();
        newMatchHistory.uuid = uuidv4();
        newMatchHistory.match_uuid = uuid;
        newMatchHistory.prev_status = oldStatus;
        newMatchHistory.status = status;
        newMatchHistory.createdBy = req.data?.uuid || undefined;
        await entityManager.save(newMatchHistory);
        
        utilLib.loggingRes(req, { data, message: "Match status updated successfully!" });
        return res.json({ data, message: "Match status updated successfully!" });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async updateSetScore(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { home_team_score, away_team_score, set_number, type, game_history } =
      req.body;
    try {
      if (
        !home_team_score ||
        !away_team_score ||
        !set_number ||
        !type ||
        !game_history
      ) {
        throw new Error("All fields are required!");
      }

      // check Exist
      const matchesRepo = AppDataSource.getRepository(Matches);
      const matchExist = await matchesRepo.findOneBy({ uuid });
      if (!matchExist) {
        throw new Error("Match not found!");
      }

      if (!["regular", "tiebreak"].includes(type)) {
        throw new Error("Type should be regular or tiebreak!");
      }

      const setRepo = AppDataSource.getRepository(Game);
      const setLogrepo = AppDataSource.getRepository(SetLog);
      const set = await setRepo.findOneBy({
        match_uuid: uuid,
        set: Number(set_number),
      });
      let data: any;
      if (set) {
        if (set.winner_team_uuid) throw new Error("Set already finished!");
        if (
          home_team_score != set.home_team_score ||
          away_team_score != set.away_team_score
        ) {
          set.home_team_score = home_team_score;
          set.away_team_score = away_team_score;
          set.type = type;
          await setRepo.save(set);
          await setLogrepo.save({
            uuid: uuidv4(),
            set_uuid: set.uuid,
            home_team_score,
            away_team_score,
            gameHistory: game_history,
          });
        }
        data = set;
      } else {
        const newSet = new Game();
        newSet.match_uuid = uuid;
        newSet.uuid = uuidv4();
        newSet.set = Number(set_number);
        newSet.home_team_score = home_team_score;
        newSet.away_team_score = away_team_score;
        newSet.type = type;
        await setRepo.save(newSet);
        await setLogrepo.save({
          uuid: uuidv4(),
          set_uuid: newSet.uuid,
          home_team_score,
          away_team_score,
          gameHistory: game_history,
        });
        data = newSet;
      }
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async endSet(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { winner_team_uuid, set_number } = req.body;
    try {
      if (!set_number || !winner_team_uuid) {
        throw new Error("All fields are required!");
      }

      // check Exist
      const matchesRepo = AppDataSource.getRepository(Matches);
      const matchExist = await matchesRepo.findOneBy({ uuid });
      if (!matchExist) {
        throw new Error("Match not found!");
      }
      const setRepo = AppDataSource.getRepository(Game);
      const data = await setRepo.findOneBy({
        match_uuid: uuid,
        set: Number(set_number),
      });
      if (!data) throw new Error("Set not found!");
      if (data.winner_team_uuid) throw new Error("Set already finished!");
      if (winner_team_uuid) {
        data.winner_team_uuid = winner_team_uuid;
        await setRepo.save(data);
      }
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async delete(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const matchesRepo = AppDataSource.getRepository(Matches);
      const data = await matchesRepo.findOneBy({ uuid, deletedAt: IsNull() });
      if (!data) {
        throw new Error("Match not found!");
      }
      data.deletedAt = new Date();
      data.deletedBy = req.data?.uuid || undefined;
      await matchesRepo.save(data);
      utilLib.loggingRes(req, { data, message: "Match deleted successfully!" });
      return res.json({ data, message: "Match deleted successfully!" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async getMatchesByPlayerUUID(playerUUID: string, status?: MatchStatus): Promise<Matches[]> {
    
    const matchRepository = AppDataSource.getRepository(Matches);
    const matchesQB = await matchRepository
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
    if (status) {
      if (status !== MatchStatus.ENDED) {
        matchesQB.andWhere("match.status = :status", { status });
      } else {
        matchesQB.andWhere("match.status = :status", { status });
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
    const status = req.query.status as MatchStatus || MatchStatus.ENDED;
    const player_uuid = req.params.player_uuid || req.data?.uuid;
    
    try {
      const matches = await this.getMatchesByPlayerUUID(player_uuid, status);
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
  // BEGIN: Public API
  async publicMatchList(req: any, res: any, status?: MatchStatus) {
    const utilLib = Util.getInstance();
    const { tournament_uuid } = req.query;
    try {
      const page = Number.parseInt((req.query.page as string) || "1", 10);
      const limit = Number.parseInt((req.query.limit as string) || "10", 10);
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
      if (status) {
        queryBuilder
          .andWhere("matches.status = :status", { status });
        if (status == MatchStatus.UPCOMING) {
          queryBuilder
            .andWhere("matches.time > NOW()");
        }
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

  async publicMatchDetail(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const matchesRepo = AppDataSource.getRepository(Matches);
      const matchAvailable = await matchesRepo.findOneBy({ uuid, deletedAt: IsNull() });
      if (!matchAvailable) throw new Error(`Match doesn't exists`);

      const qbuilder = await matchesRepo
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

}
