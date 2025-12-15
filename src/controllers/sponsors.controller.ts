import { Sponsors } from "../entities/Sponsors";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { IsNull, Not } from "typeorm";

export default class SponsorsController {
  async create(req: any, res: any) {
    const utilLib = new Util();
    const { name, description, media_url, type, slot } = req.body;
    try {
      if (!name || !description || !media_url || !type) {
        throw new Error("Name, description, type, and media_url are required!");
      }

      const sponsorsRepo = AppDataSource.getRepository(Sponsors);

      // Check if a sponsor with the same name already exists
      const existingSponsor = await sponsorsRepo.findOneBy({ name });
      if (existingSponsor) {
        throw new Error("A sponsor with the same name already exists!");
      }

      const newSponsor = new Sponsors();
      newSponsor.uuid = uuidv4();
      newSponsor.name = name;
      newSponsor.description = description;
      newSponsor.media_url = media_url;
      newSponsor.type = type;
      newSponsor.slot = slot;
      newSponsor.createdBy = req.data?.uuid || undefined;

      const data = await sponsorsRepo.save(newSponsor);
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
      const sponsorsRepo = AppDataSource.getRepository(Sponsors);
      const queryBuilder = sponsorsRepo
        .createQueryBuilder("sponsors")
        .where("sponsors.name LIKE :search", { search: `%${search}%` })
        .andWhere("sponsors.deletedBy IS NULL")
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

  async listSlot(req: any, res: any) {
    const utilLib = new Util();
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const sponsorsRepo = AppDataSource.getRepository(Sponsors);
     const queryBuilder = sponsorsRepo
    .createQueryBuilder("sponsors")
    .select("DISTINCT sponsors.slot as name") // Only select the column you're grouping by
    // .where("sponsors.name LIKE :search", { search: `%${search}%` })
    .andWhere("sponsors.deletedBy IS NULL")
    .andWhere("sponsors.slot IS NOT NULL")
    // .groupBy("sponsors.slot") // Group by the same column
    .skip(offset)
       .take(limit);
      
      const data = await queryBuilder.getRawMany();

      utilLib.loggingRes(req, { data });
      return res.json({
        data,
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
      const sponsorsRepo = AppDataSource.getRepository(Sponsors);
      const data = await sponsorsRepo.findOne({
        where: { uuid },
        relations: ["tournament"], // Load the associated tournament sponsors
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
    const { name, description, media_url, type, slot } = req.body;
    try {
      const sponsorsRepo = AppDataSource.getRepository(Sponsors);

      // Check if a sponsor with the same name already exists (excluding the current sponsor)
      if (name) {
        const existingSponsor = await sponsorsRepo.findOneBy({ name, uuid: Not(uuid) });
        if (existingSponsor) {
          throw new Error("A sponsor with the same name already exists!");
        }
      }

      let data = await sponsorsRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.name = name || data.name;
      data.description = description || data.description;
      data.media_url = media_url || data.media_url;
      data.type = type || data.type;
      data.slot = slot || data.slot;
      data = await sponsorsRepo.save(data);
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
      const sponsorsRepo = AppDataSource.getRepository(Sponsors);
      const data = await sponsorsRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.deletedBy = req.data?.uuid || undefined;
      data.deletedAt = new Date();
      await sponsorsRepo.save(data);
      utilLib.loggingRes(req, { message: "Sponsor deleted successfully" });
      return res.json({ message: "Sponsor deleted successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async listSponsorBySlot(req: any, res: any) {
    const utilLib = new Util();
    const { slot } = req.query;
    try {
      const sponsorsRepo = AppDataSource.getRepository(Sponsors);
      const data = await sponsorsRepo.find({
        where: {
          slot: slot,
          deletedBy: IsNull()
        }
      });
      utilLib.loggingRes(req, { data , message: "Sponsors fetched successfully" });
      return res.json({ data, message: "Sponsors fetched successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}