import { Levels } from "../entities/Levels";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { Not } from "typeorm";

export default class LevelsController {
  async create(req: any, res: any) {
    const utilLib = new Util();
    const { name, level_tier } = req.body;
    try {
      if (!name || !level_tier) {
        throw new Error("Name and level tier are required!");
      }
      // Check if level name already exists
      const levelsRepo = AppDataSource.getRepository(Levels);
      const dataExists = await levelsRepo.findOneBy({ name });
      if (dataExists) {
        throw new Error("Level name already exists!");
      }
      const newData = new Levels();
      newData.uuid = uuidv4();
      newData.name = name;
      newData.level_tier = level_tier;
      newData.createdBy = req.data?.uuid || undefined;
      const data = await levelsRepo.save(newData);
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async list(req: any, res: any) {
    const utilLib = new Util();
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const levelsRepo = AppDataSource.getRepository(Levels);
      const queryBuilder = levelsRepo
        .createQueryBuilder("levels")
        .where("levels.name LIKE :search", { search: `%${search}%` })
        .andWhere("levels.deletedBy IS NULL")
        .orderBy("levels.level_tier", "DESC")
        .skip(offset)
        .take(limit);
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
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const levelsRepo = AppDataSource.getRepository(Levels);
      const data = await levelsRepo.findOne({
        where: { uuid },
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
    const utilLib = new Util();
    const { uuid } = req.params;
    const { name, level_tier } = req.body;
    try {
      const levelsRepo = AppDataSource.getRepository(Levels);
      if (name) {
        const nameExist = await levelsRepo.findOneBy({ name, uuid: Not(uuid) });
        if (nameExist) throw new Error("Level name already exists!");
      }
      let data = await levelsRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.name = name || data.name;
      data.level_tier = level_tier || data.level_tier;
      data = await levelsRepo.save(data);
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async delete(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const levelsRepo = AppDataSource.getRepository(Levels);
      const data = await levelsRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.deletedBy = req.data?.uuid || undefined;
      data.deletedAt = new Date();
      await levelsRepo.save(data);
      utilLib.loggingRes(req, { message: "Level deleted successfully" });
      return res.json({ message: "Level deleted successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}