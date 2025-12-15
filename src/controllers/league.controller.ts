import { League } from "../entities/League";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { Not } from "typeorm";

export default class LeagueController {
  async create(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { name, description, year, status, media_url, color_scheme } = req.body;
    try {
      if (!name || !year || !status) {
        throw new Error("Name, League year and status are required!");
      }
      // Check if level name already exists
      const leagueRepo = AppDataSource.getRepository(League);
      const dataExists = await leagueRepo.findOneBy({ name, year });
      if (dataExists) {
        throw new Error("League name and Year already exists!");
      }
      const newData = new League();
      newData.name = name;
      newData.description = description;
      newData.color_scheme = color_scheme;
      newData.year = year;
      newData.status = status;
      newData.media_url = media_url;
      newData.updatedBy = req.data?.uuid || undefined;
      const data = await leagueRepo.save(newData);
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async list(req: any, res: any) {
    const utilLib = Util.getInstance();
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const {year, status, future} = req.query;
      const leagueRepo = AppDataSource.getRepository(League);
      const queryBuilder = leagueRepo
        .createQueryBuilder("league")
        .where("league.name LIKE :search", { search: `%${search}%` })
        .andWhere("league.deletedBy IS NULL")
        .orderBy("league.year", "DESC")
        .orderBy("league.status", "DESC")
        .skip(offset)
        .take(limit);
      if(year){
        if(year === "future"){
          queryBuilder.andWhere("league.year > :year", { year });
        } else { 
          queryBuilder.andWhere("league.year = :year", { year });
        }
      }
      if(status){
        queryBuilder.andWhere("league.status = :status", { status });
      }
      const [data, totalRecords] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(totalRecords / limit);
      utilLib.loggingRes(req, { data });
      return res.json({
        data,
        totalRecords,
        totalPages,
        currentPage: page,
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async detail(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { id } = req.params;
    try {
      const leagueRepo = AppDataSource.getRepository(League);
      const data = await leagueRepo.findOne({
        where: { id },
      });
      if (!data) throw new Error(`Data not found`);
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async update(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { id } = req.params;
    const { name, year, status, media_url, color_scheme } = req.body;
    try {
      const leagueRepo = AppDataSource.getRepository(League);
      if (name) {
        const nameExist = await leagueRepo.findOneBy({ name, id: Not(id) });
        if (nameExist) throw new Error("League name already exists!");
      }
      let data = await leagueRepo.findOneBy({ id });
      if (!data) throw new Error(`Data not found`);
      data.name = name || data.name;
      data.year = year || data.year;
      data.status = status || data.status;
      data.media_url = media_url || data.media_url;
      data.color_scheme = color_scheme || data.color_scheme;
      data.updatedBy = req.data?.uuid || undefined;
      data.updatedAt = new Date();
      data = await leagueRepo.save(data);
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async delete(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { id } = req.params;
    try {
      const leagueRepo = AppDataSource.getRepository(League);
      const data = await leagueRepo.findOneBy({ id });
      if (!data) throw new Error(`Data not found`);
      data.deletedBy = req.data?.uuid || undefined;
      data.deletedAt = new Date();
      await leagueRepo.save(data);
      utilLib.loggingRes(req, { message: "League deleted successfully" });
      return res.json({ message: "League deleted successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}