import { statusTournamentEnum, Tournament, typeTournamentEnum } from "../entities/Tournament";
import { Rule } from "../entities/Rule";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { In, IsNull, Like, MoreThan, Not } from "typeorm";
import { PlayerTeam } from "../entities/PlayerTeam";
import { Matches } from "../entities/Matches";
import { TournamentSponsors } from "../entities/TournamentSponsors";
import { TournamentGroup } from "../entities/TournamentGroups";

export default class TournamentController {
  async create(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { name, description, start_date, end_date, league_id, media_url, type, court_uuid, level_uuid, strict_level, rules, total_group } = req.body;
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
        newData.league_id = league_id;
        newData.total_group = total_group;
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
        court: d.court?.name,
        level: d.level?.name,
        player_count: playerCount.find(pc => pc.tournament_uuid === d.uuid)?.counter || 0,
        match_count: matchCount.find(pc => pc.tournament_uuid === d.uuid)?.counter || 0,
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
    const { uuid } = req.params;
    const { name, description, start_date, end_date, status, court_uuid, level_uuid, strict_level, league_id, media_url, point_config_uuid, rules, total_group } = req.body;
    
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      if (name) {
        const nameExist = await tRepo.findOneBy({ name, uuid: Not(uuid) });
        if (nameExist) throw new Error("Tournament name already exists!");
      }
      await AppDataSource.transaction(async (transactionalEntityManager) => {

        let data = await tRepo.findOneBy({ uuid });
        if (!data) throw new Error(`Data not found`);
        data.name = name || data.name;
        data.description = description || data.description;
        data.start_date = start_date || data.start_date;
        data.end_date = end_date || data.end_date;
        data.status = status || data.status;
        data.media_url = media_url || data.media_url;
        data.court_uuid = court_uuid || data.court_uuid;
        data.level_uuid = level_uuid || data.level_uuid;
        data.point_config_uuid = point_config_uuid || data.point_config_uuid;
        data.strict_level = strict_level || data.strict_level;
        data.league_id = league_id || data.league_id;
        data.total_group = total_group || data.total_group;
      
        data = await transactionalEntityManager.save(data);
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
    const {uuid} = req.params;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
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
}
