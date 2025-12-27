import { Tags, TagsType } from "../entities/Tags";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { Not } from "typeorm";

export default class TagsController {
  async create(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { name, parent_uuid, type } = req.body;
    try {
      if (!name) {
        throw new Error("Name is required!");
      }
      // Check if tag name already exists
      const tagsRepo = AppDataSource.getRepository(Tags);
      const dataExists = await tagsRepo.findOneBy({ name });
      if (dataExists) {
        throw new Error("Tag name already exists!");
      }
      const newData = new Tags();
      newData.uuid = uuidv4();
      newData.name = name;
      newData.type = type || TagsType.blog;
      newData.parent_uuid = parent_uuid || null; // Set parent_uuid if provided
      newData.createdBy = req.data?.uuid || undefined;
      const data = await tagsRepo.save(newData);
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
      const type = (req.query.type as string) || "";
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const tagsRepo = AppDataSource.getRepository(Tags);
      const queryBuilder = tagsRepo
        .createQueryBuilder("tags")
        .where("tags.name LIKE :search", { search: `%${search}%` })
        .andWhere("tags.deletedBy IS NULL")
        .orderBy("tags.createdAt", "DESC")
        .skip(offset)
        .take(limit);
      if (type) {
        queryBuilder.andWhere("tags.type = :type", { type });
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
    const { uuid } = req.params;
    try {
      const tagsRepo = AppDataSource.getRepository(Tags);
      const data = await tagsRepo.findOne({
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
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { name, parent_uuid, type } = req.body;
    try {
      const tagsRepo = AppDataSource.getRepository(Tags);
      if (name) {
        const nameExist = await tagsRepo.findOneBy({ name, uuid: Not(uuid) });
        if (nameExist) throw new Error("Tag name already exists!");
      }
      let data = await tagsRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.name = name || data.name;
      data.parent_uuid = parent_uuid || data.parent_uuid;
      data.type = type || data.type;
      data = await tagsRepo.save(data);
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
      const tagsRepo = AppDataSource.getRepository(Tags);
      const data = await tagsRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.deletedBy = req.data?.uuid || undefined;
      data.deletedAt = new Date();
      await tagsRepo.save(data);
      utilLib.loggingRes(req, { message: "Tag deleted successfully" });
      return res.json({ message: "Tag deleted successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}