import { statusTournamentEnum, Tournament, typeTournamentEnum } from "../entities/Tournament";
import { Rule } from "../entities/Rule";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { In, IsNull, Like, MoreThan, Not } from "typeorm";
import { PlayerTeam, PTStatusEnum } from "../entities/PlayerTeam";
import { Matches } from "../entities/Matches";
import { TournamentSponsors } from "../entities/TournamentSponsors";
import { TournamentGroup } from "../entities/TournamentGroups";
import { TournamentService } from "../services/tournament.service";

export default class TournamentController {
  constructor() {
    this.update = this.update.bind(this);
  }
  private tournamentService = new TournamentService();

  async create(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { name, description, start_date, end_date, league_id, media_url, type, court_uuid, level_uuid, strict_level, draft_pick, show_bracket, commitment_fee, rules, total_group, group_qualifier, max_player } = req.body;
    try {
      if (!name || !description) {
        throw new Error("All fields are required!");
      }
      // check username exists
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        const tRepo = AppDataSource.getRepository(Tournament);
        const dataExists = await tRepo.findOneBy({ name });
        if (dataExists) {
          throw new Error("Tournament name already exists!");
        }
        const newData = new Tournament();
        newData.uuid = uuidv4();
        newData.name = name;
        newData.description = description;
        newData.start_date = start_date;
        newData.end_date = end_date;
        newData.status = statusTournamentEnum.DRAFT;
        newData.media_url = media_url;
        newData.type = type || typeTournamentEnum.KNOCKOUT;
        newData.court_uuid = court_uuid;
        newData.level_uuid = level_uuid;
        newData.strict_level = strict_level;
        newData.draft_pick = draft_pick || false;
        newData.show_bracket = show_bracket || false;
        newData.commitment_fee = commitment_fee || 0.00;
        newData.league_id = league_id;
        newData.total_group = total_group;
        newData.group_qualifier = group_qualifier || 1;
        newData.max_player = max_player;
        newData.createdBy = req.data?.uuid || undefined;
        const data = await transactionalEntityManager.save(newData);
        
        if (rules && rules.length > 0 && data.uuid) {
          for (const rule of rules) {
            const newRule = new Rule();
            newRule.uuid = uuidv4();
            newRule.tournament_uuid = data.uuid;
            newRule.description = rule.description;
            newRule.createdBy = req.data?.uuid || undefined;
            await transactionalEntityManager.save(newRule);
          }
        }
        utilLib.loggingRes(req, { data });
        return res.json({ data });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async list(req: any, res: any) {
    const utilLib = Util.getInstance();
    try {
      const { type } = req.query;
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "1");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const tRepo = AppDataSource.getRepository(Tournament);
      const playerTeamsRepo = AppDataSource.getRepository(PlayerTeam);
      const matchRepo = AppDataSource.getRepository(Matches);

      const queryBuilder = tRepo.createQueryBuilder("tournament")
        .leftJoinAndSelect("tournament.rules", "rules")
        .leftJoinAndSelect("tournament.court", "court")
        .leftJoinAndSelect("tournament.level", "level")
        .where("tournament.name LIKE :search", { search: `%${search}%` })
        .andWhere("tournament.deletedBy IS NULL")
        .andWhere("rules.deletedBy IS NULL")
        .andWhere("court.deletedBy IS NULL")
        .andWhere("level.deletedBy IS NULL")
      if (type) {
        if (type.includes(",")) {
          queryBuilder.andWhere("tournament.type IN (:...types)", { types: type.split(",").map((t: string) => t.trim()) });
        } else {
          queryBuilder.andWhere("tournament.type = :type", { type });
        }
      }
      queryBuilder
        .skip(offset)
        .take(limit);
      const [data, totalRecords] = await queryBuilder.getManyAndCount();
      if (!data.length) {
        return res.json({ data: [], totalRecords, totalPages: 1, currentPage: 1 });
      }
      const playerCount = await playerTeamsRepo.createQueryBuilder("playerTeam")
        .select("COUNT(playerTeam.player_uuid) as counter, playerTeam.tournament_uuid")
        .where("playerTeam.deletedBy IS NULL")
        .andWhere("playerTeam.tournament_uuid IN (:...tournamentUuids)", { tournamentUuids: data.map(d => d.uuid) })
        .groupBy("playerTeam.tournament_uuid")
        .getRawMany();
      const matchCount = await matchRepo.createQueryBuilder("match")
        .select("COUNT(match.uuid) as counter, match.tournament_uuid")
        .where("match.deletedBy IS NULL")
        .andWhere("match.tournament_uuid IN (:...tournamentUuids)", { tournamentUuids: data.map(d => d.uuid) })
        .groupBy("match.tournament_uuid")
        .getRawMany();
      
      const result = data.map((d) => ({
        ...d,
        commitment_fee: parseFloat(String(d.commitment_fee)),
        court: d.court?.name,
        level: d.level?.name,
        player_count: playerCount.find(pc => pc.tournament_uuid === d.uuid)?.counter || 0,
        match_count: matchCount.find(pc => pc.tournament_uuid === d.uuid)?.counter || 0,
        max_player: d.max_player,
      }));

      const totalPages = Math.ceil(totalRecords / limit);
      utilLib.loggingRes(req, { data: result });
      return res.json({
        data: result,
        totalRecords,
        totalPages,
        currentPage: page,
      });
    } catch (error: any) {
      console.log(error);

      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async detail(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const ruleRepo = AppDataSource.getRepository(Rule);
      const playerTeamsRepo = AppDataSource.getRepository(PlayerTeam)
      const matchRepo = AppDataSource.getRepository(Matches)
      const data = await tRepo.findOne({
        where: {
          uuid,
        },
        relations: {
          court: true,
          level: true,
        },
      });
      if (!data) throw new Error(`Data not found`);
      const rules = await ruleRepo
        .createQueryBuilder("rule")
        .where("rule.tournament_uuid = :uuid", { uuid: data.uuid })
        .andWhere("rule.deletedAt IS NULL")
        .getMany();
      
      const playerCount = await playerTeamsRepo.countBy({ tournament_uuid: uuid });
      const matchCount = await matchRepo.countBy({ tournament_uuid: uuid });
      data.rules = rules;
      const result = {
        ...data,
        court: data.court?.name,
        level: data.level?.name,
        player_count: playerCount,
        match_count: matchCount,
        commitment_fee: Number(data.commitment_fee) || 0,
        max_player: data.max_player,
      }
      utilLib.loggingRes(req, { data: result });
      return res.json({ data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async update(req: any, res: any) {
    const utilLib = Util.getInstance();
    const tournamentService = new TournamentService();
    const { uuid } = req.params;
    const { name, description, start_date, end_date, status, court_uuid, level_uuid, strict_level, draft_pick, show_bracket, commitment_fee, league_id, media_url, point_config_uuid, rules, total_group, group_qualifier, max_player } = req.body;
    const adminUuid = req.data?.uuid;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      if (name) {
        const nameExist = await tRepo.findOneBy({ name, uuid: Not(uuid) });
        if (nameExist) throw new Error("Tournament name already exists!");
      }
      await AppDataSource.transaction(async (transactionalEntityManager) => {

        let data = await tRepo.findOneBy({ uuid });
        if (!data) throw new Error(`Data not found`);
        
        // Check if total_group has changed
        const totalGroupChanged = total_group !== undefined && total_group !== data.total_group;
        const groupQualifierChanged = group_qualifier !== undefined && group_qualifier !== data.group_qualifier;
        const maxPlayerChanged = max_player !== undefined && max_player !== data.max_player;
        
        // Prevent changing total_group, group_qualifier, and max_player when show_bracket is true
        if (data.show_bracket && (totalGroupChanged || groupQualifierChanged || maxPlayerChanged)) {
          throw new Error("Cannot change total_group, group_qualifier, or max_player when show_bracket is enabled");
        }
        
        data.name = name || data.name;
        data.description = description || data.description;
        data.start_date = start_date || data.start_date;
        data.end_date = end_date || data.end_date;
        data.status = status || data.status;
        data.media_url = media_url || data.media_url;
        data.court_uuid = court_uuid || data.court_uuid;
        data.level_uuid = level_uuid || data.level_uuid;
        data.point_config_uuid = point_config_uuid || data.point_config_uuid;
        data.strict_level = strict_level === undefined || strict_level === null ? data.strict_level : strict_level;
        data.draft_pick = draft_pick === undefined || draft_pick === null ? data.draft_pick : draft_pick;
        data.show_bracket = show_bracket === undefined || show_bracket === null ? data.show_bracket : show_bracket;
        data.commitment_fee = commitment_fee === undefined || commitment_fee === null ? data.commitment_fee : commitment_fee;
        data.league_id = league_id || data.league_id;
        data.total_group = total_group || data.total_group;
        data.group_qualifier = group_qualifier !== undefined ? group_qualifier : data.group_qualifier;
        data.max_player = max_player || data.max_player;
      
        data = await transactionalEntityManager.save(data);
        
        // If total_group changed, reset groups and team assignments
        if (totalGroupChanged) {
          await this.tournamentService.resetTournamentGroups(adminUuid, uuid, transactionalEntityManager);
        }
        
        if (rules && rules.length > 0 && uuid) {
          const ruleRepo = AppDataSource.getRepository(Rule);
          for (const rule of rules) {
            if (rule.uuid) {
              const existingRule = await ruleRepo.findOneBy({ uuid: rule.uuid, tournament_uuid: uuid });
              if (existingRule && rule.is_delete) {
                existingRule.deletedAt = new Date();
                existingRule.deletedBy = req.data?.uuid || undefined;
                await transactionalEntityManager.save(existingRule);
              } else if (existingRule) {
                existingRule.description = rule.description;
                await transactionalEntityManager.save(existingRule);
              } 
            } else {  
              const newRule = new Rule();
              newRule.uuid = uuidv4();
              newRule.tournament_uuid = uuid;
              newRule.description = rule.description;
              newRule.createdBy = req.data?.uuid || undefined;
              await transactionalEntityManager.save(newRule);
            }
            
          }
        }
        utilLib.loggingRes(req, { data });
        return res.json({ data });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async toggleFeatured(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const data = await tRepo.findOneBy({ uuid, deletedAt: IsNull() });
      
      if (!data) throw new Error(`Tournament not found`);
      
      data.featured_at = !data.featured_at ? new Date() : undefined;
      
      await tRepo.save(data);
      utilLib.loggingRes(req, { message: "Tournament featured status toggled successfully" });
      return res.json({ message: "Tournament featured status toggled successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async publish(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { unpublish } = req.query;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const data = await tRepo.findOneBy({ uuid, deletedAt: IsNull() });
      if (!data) throw new Error(`Data not found`);
      // data.status = unpublish === true || unpublish === "true" ? statusTournamentEnum.DRAFT : statusTournamentEnum.PUBLISHED;
      data.published_at = unpublish === true || unpublish === "true" ? null : new Date();
      await tRepo.save(data);
      utilLib.loggingRes(req, { data, message: unpublish === true ? "Data unpublished successfully" : "Data published successfully" });
      return res.json({ data, message: unpublish === true ? "Data unpublished successfully" : "Data published successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async updateStatus(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const data = await tRepo.findOneBy({ uuid, deletedAt: IsNull() });
      if (!data) throw new Error(`Data not found`);
      data.status = status;
      data.updatedAt = new Date();
      data.updatedBy = req.data?.uuid || undefined;
      await tRepo.save(data);
      utilLib.loggingRes(req, { data, message: "Data updated successfully" });
      return res.json({ data, message: "Data updated successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async updateTournamentSponsor(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { sponsors } = req.body;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const data = await tRepo.findOneBy({ uuid, deletedAt: IsNull() });
      if (!data) throw new Error(`Tournament not found`);
      const tSponsorRepo = AppDataSource.getRepository(TournamentSponsors);
      AppDataSource.transaction(async (entityManager) => {
        for (const s of sponsors) {
          if (!!s.uuid) {
            const existingSponsor = await tSponsorRepo.findOneBy({ tournament_uuid: uuid, sponsor_uuid: s.sponsor_uuid, uuid: s.uuid });
            if (existingSponsor && s.is_delete) {
              existingSponsor.deletedAt = new Date();
              existingSponsor.deletedBy = req.data?.uuid || undefined;
              await entityManager.save(existingSponsor);
            } 
          } else {
            const newSponsor = new TournamentSponsors();
            newSponsor.uuid = uuidv4();
            newSponsor.tournament_uuid = uuid;
            newSponsor.sponsor_uuid = s.sponsor_uuid;
            newSponsor.createdBy = req.data?.uuid || undefined;
            await entityManager.save(newSponsor);
          }
        }

        const savedSponsors = await tSponsorRepo.find({
          where: {
            tournament_uuid: uuid,
            deletedAt: IsNull(),
          },
          relations: {
            sponsor: true,
          },
        });
        const finalResult = savedSponsors.map((s) => {
          return {
            ...s.sponsor,
            sponsor_uuid: s.sponsor_uuid,
            uuid: s.uuid
          }
        });
        
        utilLib.loggingRes(req, { data:finalResult, message: "Sponsors updated successfully" });
        return res.json({ data:finalResult, message: "Sponsors updated successfully" });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async listSponsors(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const data = await tRepo.findOneBy({ uuid, deletedAt: IsNull() });
      if (!data) throw new Error(`Tournament not found`);
      const tSponsorRepo = AppDataSource.getRepository(TournamentSponsors);
      const sponsors = await tSponsorRepo.find({
        where: {
          tournament_uuid: uuid,
          deletedAt: IsNull(),
        },
        relations: {
          sponsor: true,
        },
      });
      const result = sponsors.map((s) => {
        return {
          ...s.sponsor,
          sponsor_uuid: s.sponsor_uuid,
          uuid: s.uuid
        }
      });
      utilLib.loggingRes(req, { data: result });
      return res.json({ data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async delete(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const data = await tRepo.findOneBy({ uuid, deletedAt: IsNull() });
      if (!data) throw new Error(`Data not found`);
      data.deletedAt = new Date();
      data.deletedBy = req.data?.uuid || undefined;
      await tRepo.save(data);
      utilLib.loggingRes(req, { data, message: "Data deleted successfully" });
      return res.json({ data, message: "Data deleted successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  // BEGIN: Public API
  async publicDetail(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const playerUuid = req.data?.uuid || req.user?.uuid;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const ptRepo = AppDataSource.getRepository(PlayerTeam);
      
      // Check if player has joined this tournament
      let playerJoinStatus = null;
      if (playerUuid) {
        const playerTeam = await ptRepo.findOne({
          where: {
            player_uuid: playerUuid,
            tournament_uuid: uuid,
            deletedAt: IsNull()
          }
        });
        playerJoinStatus = playerTeam?.status || null;
      }
      
      const data = await tRepo.findOne({
        where: {
          uuid,
        },
        relations: {
          court: true,
          level: true,
          point_config: {
            points: true
          },
          rules: true,
        },
      });
      if (!data) throw new Error(`Data not found`);
      const result = {
        ...data,
        court: data.court?.name,
        court_info: data.court,
        level: data.level?.name,
        point_config: data.point_config?.name,
        points: data.point_config?.points,
        rules: data.rules,
        join_status: playerJoinStatus,
        commitment_fee: Number(data.commitment_fee) || 0,
        max_player: data.max_player,
      }
      utilLib.loggingRes(req, { data: result });
      return res.json({ data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async featured(req: any, res: any) {
    const utilLib = Util.getInstance();
    const {limit} = req.query;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      // use query builder based on featured_at to check if tournament is featured on last 2 months, and if empty get featured_at not null
      const queryBuilder = tRepo.createQueryBuilder("tournament");

      queryBuilder.leftJoinAndSelect("tournament.rules", "rules")
        .leftJoinAndSelect("tournament.court", "court")
        .leftJoinAndSelect("tournament.level", "level")
      
      queryBuilder.where("(tournament.featured_at IS NOT NULL");
      queryBuilder.andWhere("tournament.published_at IS NOT NULL");
      queryBuilder.andWhere("tournament.featured_at >= :date", { date: new Date(new Date().setMonth(new Date().getMonth() - 2)) });
      queryBuilder.andWhere("tournament.end_date >= :date", { date: new Date(new Date().setDate(new Date().getDay() - 1)) });
      queryBuilder.andWhere("tournament.deletedAt IS NULL)");
      queryBuilder.limit(limit);
      
      let [data, count] = await queryBuilder.getManyAndCount();
      if (limit && count < limit) {
        queryBuilder.orWhere("(tournament.featured_at IS NOT NULL");
        queryBuilder.andWhere("tournament.published_at IS NOT NULL");
        queryBuilder.andWhere("tournament.end_date >= :date", { date: new Date(new Date().setDate(new Date().getDay() - 1)) });
        queryBuilder.andWhere("tournament.deletedAt IS NULL)");
        queryBuilder.limit(limit - count);
        const [newData, newCount] = await queryBuilder.getManyAndCount();
        data.push(...newData);
        count += newCount;
      }
      if (limit && count < limit) {
        queryBuilder.orWhere("(tournament.featured_at IS NULL");
        queryBuilder.andWhere("tournament.published_at IS NOT NULL");
        queryBuilder.andWhere("tournament.end_date >= :date", { date: new Date(new Date().setDate(new Date().getDay() - 1)) });
        queryBuilder.andWhere("tournament.deletedAt IS NULL)");
        queryBuilder.limit(limit - count);
        const [newData, newCount] = await queryBuilder.getManyAndCount();
        data.push(...newData);
        count += newCount;
      }

      // Remove duplicates based on tournament UUID
      const uniqueData = data.filter((tournament, index, self) =>
        index === self.findIndex((t) => t.uuid === tournament.uuid)
      );

      const result = uniqueData.map((d) => ({
        ...d,
        court: d.court?.name,
        level: d.level?.name,
      }));
      
      utilLib.loggingRes(req, { data: result, message: "Tournament featured fetched successfully" });
      return res.json({ data: result, message: "Tournament featured fetched successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  // Player joins tournament
  joinTournament = async (req: any, res: any) => {
    const utilLib = Util.getInstance();
    const { uuid: tournamentUuid } = req.params;
    const playerUuid = req.data?.uuid || req.user?.uuid;

    try {
      if (!playerUuid) {
        throw new Error("Player authentication required");
      }

      const result = await this.tournamentService.requestJoinTournament(playerUuid, tournamentUuid, req?.body?.player_uuid);
      if (result.error) {
        return res.status(result.error).json({ message: result.message });
      }
      
      utilLib.loggingRes(req, result);
      return res.json(result);
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  // Admin updates join request status (approve/reject)
  updateJoinRequestStatus = async (req: any, res: any) => {
    const utilLib = Util.getInstance();
    const { tournamentUuid, playerUuid } = req.params;
    const { status } = req.body;
    const adminUuid = req.data?.uuid || req.user?.uuid;

    try {
      if (!adminUuid) {
        throw new Error("Admin authentication required");
      }

      if (!status || (status !== 'approve' && status !== 'reject')) {
        throw new Error("Invalid status. Must be 'approve' or 'reject'");
      }

      const result = await this.tournamentService.updateJoinRequestStatus(playerUuid, tournamentUuid, adminUuid, status);
      
      utilLib.loggingRes(req, result);
      return res.json(result);
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  // Get team participants with status filtering
  getTeamParticipants = async (req: any, res: any) => {
    const utilLib = Util.getInstance();
    const { tournamentUuid } = req.params;
    let { status, page = 1, limit = 200 } = req.query;
    const adminUuid = req.data?.uuid || req.user?.uuid;
    if (!adminUuid && status?.includes("reject")) {
      status = "approved,confirmed,requested"
    }

    try {
      if (!tournamentUuid) {
        throw new Error("Tournament UUID is required");
      }

      const parsedStatuses:PTStatusEnum[] = status?.split(",")?.map((s: string) => s.toUpperCase() as PTStatusEnum) || [];
      const result = await this.tournamentService.getTeamParticipants(tournamentUuid, parsedStatuses, Number(page), Number(limit));
       
      utilLib.loggingRes(req, result);
      return res.json(result);
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  // Update team join request status
  updateTeamJoinRequestStatus = async (req: any, res: any) => {
    const utilLib = Util.getInstance();
    const { tournamentUuid } = req.params;
    const { teamUuid, status } = req.body;
    const adminUuid = req.data?.uuid || req.user?.uuid;

    try {
      if (!adminUuid) {
        throw new Error("Admin authentication required");
      }

      const parsedStatus: PTStatusEnum | undefined = status?.toUpperCase() as PTStatusEnum;
      if (!parsedStatus) {
        throw new Error("Invalid status. Must be 'approved' or 'rejected' or 'confirmed'");
      }

      if (!teamUuid) {
        throw new Error("Team UUID is required");
      }

      const result = await this.tournamentService.updateTeamJoinRequestStatus(teamUuid, tournamentUuid, adminUuid, parsedStatus);
      
      utilLib.loggingRes(req, result);
      return res.json(result);
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  addTeam = async (req: any, res: any) => {
    const utilLib = Util.getInstance();
    const { player_uuids, status } = req.body;
    const { uuid: tournament_uuid } = req.params;
    
    try {
      if (!player_uuids || !tournament_uuid) {
        throw new Error("player_uuids and tournament_uuid are required");
      }

      const result = await this.tournamentService.addTeam(player_uuids, tournament_uuid, status);
      return res.json(result);
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
