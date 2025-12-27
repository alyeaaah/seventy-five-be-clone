import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { IsNull, Not } from "typeorm";
import { MatchPoint } from "../entities/MatchPoint";
import { PointConfig } from "../entities/PointConfig";

export default class PointConfigController {
  async create(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { name, points } = req.body;
    try {
      if (!name) {
        throw new Error("Name is required!");
      }
      // Check if tag name already exists
      const pointConfigRepo = AppDataSource.getRepository(PointConfig);
      const dataExists = await pointConfigRepo.findOneBy({ name });
      if (dataExists) {
        throw new Error("Tag name already exists!");
      }
      // create transactional
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        const newData = new PointConfig();
        newData.uuid = uuidv4();
        newData.name = name;
        newData.createdBy = req.data?.uuid || undefined;
        const matchPointRepo = AppDataSource.getRepository(MatchPoint);
        const data = await transactionalEntityManager.save(newData);
        for (const pointPayload of points) {
          if (!!pointPayload.is_delete && !!pointPayload.uuid) {
            const point = await matchPointRepo.findOneBy({ uuid: pointPayload.uuid, point_config_uuid: data.uuid, deletedBy: IsNull() });
            if (!point) throw new Error(`Point not found`);
            point.deletedBy = req.data?.uuid || undefined;
            point.deletedAt = new Date();
            await transactionalEntityManager.save(point);
          } else if (!!pointPayload.uuid && !pointPayload.is_delete) {
            const point = await matchPointRepo.findOneBy({ uuid: pointPayload.uuid, point_config_uuid: data.uuid, deletedBy: IsNull() });
            if (!point) throw new Error(`Point not found`);
            point.win_point = pointPayload.win_point;
            point.lose_point = pointPayload.lose_point;
            point.win_coin = pointPayload.win_coin;
            point.lose_coin = pointPayload.lose_coin;
            point.round = pointPayload.round;
            await transactionalEntityManager.save(point);
          } else {
            const newPoint = new MatchPoint();
            newPoint.uuid = uuidv4();
            newPoint.win_point = pointPayload.win_point;
            newPoint.lose_point = pointPayload.lose_point;
            newPoint.win_coin = pointPayload.win_coin;
            newPoint.lose_coin = pointPayload.lose_coin;
            newPoint.round = pointPayload.round;
            newPoint.point_config_uuid = data.uuid || "";
            newPoint.createdBy = req.data?.uuid || undefined;
            await transactionalEntityManager.save(newPoint);
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

  // create update method to update point config and matchpoint
  async update(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { name, points } = req.body;
    try {
      if (!name) {
        throw new Error("Name is required!");
      }
      // Check if tag name already exists
      const pointConfigRepo = AppDataSource.getRepository(PointConfig);
      const dataExists = await pointConfigRepo.findOneBy({ name, uuid: Not(uuid) });
      if (dataExists) {
        throw new Error("Tag name already exists!");
      }
      // create transactional
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        
        const updatedData = await pointConfigRepo.findOneBy({ uuid, deletedBy: IsNull() });
        if (!updatedData) {
          throw new Error("Tag name didn't exists");
        }
        updatedData.name = name || updatedData?.name;
        const data = await transactionalEntityManager.save(updatedData);

        const matchPointRepo = AppDataSource.getRepository(MatchPoint);
        for (const pointPayload of points) {
          if (!!pointPayload.is_delete && !!pointPayload.uuid) {
            const point = await matchPointRepo.findOneBy({ uuid: pointPayload.uuid, point_config_uuid: data.uuid, deletedBy: IsNull() });
            if (!point) throw new Error(`Point not found`);
            point.deletedBy = req.data?.uuid || undefined;
            point.deletedAt = new Date();
            await transactionalEntityManager.save(point);
          } else if (!!pointPayload.uuid && !pointPayload.is_delete) {
            const point = await matchPointRepo.findOneBy({ uuid: pointPayload.uuid, point_config_uuid: data.uuid, deletedBy: IsNull() });
            if (!point) throw new Error(`Point not found`);
            point.win_point = pointPayload.win_point;
            point.lose_point = pointPayload.lose_point;
            point.win_coin = pointPayload.win_coin;
            point.lose_coin = pointPayload.lose_coin;
            point.round = pointPayload.round;
            await transactionalEntityManager.save(point);
          } else {
            const newPoint = new MatchPoint();
            newPoint.uuid = uuidv4();
            newPoint.win_point = pointPayload.win_point;
            newPoint.lose_point = pointPayload.lose_point;
            newPoint.win_coin = pointPayload.win_coin;
            newPoint.lose_coin = pointPayload.lose_coin;
            newPoint.round = pointPayload.round;
            newPoint.point_config_uuid = data.uuid || "";
            newPoint.createdBy = req.data?.uuid || undefined;
            await transactionalEntityManager.save(newPoint);
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
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      const round = parseInt((req.query.round as string) || "0");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const pointConfigRepo = AppDataSource.getRepository(PointConfig);
      const matchPointRepo = AppDataSource.getRepository(MatchPoint);
      
      const subQuery = matchPointRepo
      .createQueryBuilder("mp")
      .select("COUNT(mp.uuid)", "count")
      .where("mp.point_config_uuid = pointConfig.uuid").andWhere("mp.deletedBy IS NULL")
      .getQuery();
      
      const queryBuilder = pointConfigRepo
        .createQueryBuilder("pointConfig")
        .select(["pointConfig.uuid as uuid", "pointConfig.name as name", "pointConfig.createdAt as createdAt", "pointConfig.updatedAt as updatedAt", `(${subQuery}) AS totalRound`])
        .where("pointConfig.name LIKE :search", { search: `%${search}%` })
        .andWhere("pointConfig.deletedBy IS NULL")
        // .leftJoinAndSelect("pointConfig.points", "points")
        .orderBy("pointConfig.createdAt", "DESC")
      
      if (limit !== 0) {
        queryBuilder.skip(offset).take(limit);
      }
      if (round > 0) {
        queryBuilder.andWhere(`(${subQuery}) >= :round`, { round });
      }

      const data = await queryBuilder.getRawMany();
      const qbTotal = pointConfigRepo
        .createQueryBuilder("pointConfig")
        .where("pointConfig.name LIKE :search", { search: `%${search}%` })
        .andWhere("pointConfig.deletedBy IS NULL");
      const [_dt, totalRecords] = await qbTotal.getManyAndCount();
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

  async dropdown(req: any, res: any) {
    const utilLib = Util.getInstance();
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const pointConfigRepo = AppDataSource.getRepository(PointConfig);
      
      const queryBuilder = pointConfigRepo
        .createQueryBuilder("pointConfig")
        .leftJoinAndSelect("pointConfig.points", "points")
        .where("pointConfig.name LIKE :search", { search: `%${search}%` })
        .andWhere("pointConfig.deletedBy IS NULL")
        .orderBy("pointConfig.createdAt", "DESC")
      
      if (limit !== 0) {
        queryBuilder.skip(offset).take(limit);
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
      const pointConfigRepo = AppDataSource.getRepository(PointConfig);
      const data = await pointConfigRepo.findOne({
        where: { uuid, points: { deletedBy: IsNull() } },
        relations: ["points"],
      });
      if (!data) throw new Error(`Data not found`);
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
      const pointConfigRepo = AppDataSource.getRepository(PointConfig);
      const data = await pointConfigRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.deletedBy = req.data?.uuid || undefined;
      data.deletedAt = new Date();
      await pointConfigRepo.save(data);
      utilLib.loggingRes(req, { message: "Tag deleted successfully" });
      return res.json({ message: "Tag deleted successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  // publicDetail
  async publicDetail(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const pointConfigRepo = AppDataSource.getRepository(PointConfig);
      const data = await pointConfigRepo.findOne({
        where: { uuid, points: { deletedBy: IsNull() } },
        relations: ["points"],
      });
      if (!data) throw new Error(`Data not found`);
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}