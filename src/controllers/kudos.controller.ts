import { Kudos } from "../entities/Kudos";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { IsNull, Like, Not } from "typeorm";
import { PlayerKudos } from "../entities/PlayerKudos";
import { Matches, MatchStatus } from "../entities/Matches";
import { Player } from "../entities/Player";

export default class KudosController {
  async create(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { name } = req.body;
    try {
      if (!name) {
        throw new Error("Name is required!");
      }
      // Check if kudos name already exists
      const kudosRepo = AppDataSource.getRepository(Kudos);
      const dataExists = await kudosRepo.findOneBy({ name });
      if (dataExists) {
        throw new Error("Kudos name already exists!");
      }
      const newData = new Kudos();
      newData.uuid = uuidv4();
      newData.name = name;
      newData.createdBy = req.data?.uuid || undefined;
      const data = await kudosRepo.save(newData);
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
      const kudosRepo = AppDataSource.getRepository(Kudos);
      const queryBuilder = kudosRepo
        .createQueryBuilder("kudos")
        .where("kudos.name LIKE :search", { search: `%${search}%` })
        .andWhere("kudos.deletedBy IS NULL")
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
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const kudosRepo = AppDataSource.getRepository(Kudos);
      const data = await kudosRepo.findOne({
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
    const { name } = req.body;
    try {
      const kudosRepo = AppDataSource.getRepository(Kudos);
      if (name) {
        const nameExist = await kudosRepo.findOneBy({ name, uuid: Not(uuid) });
        if (nameExist) throw new Error("Kudos name already exists!");
      }
      let data = await kudosRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.name = name || data.name;
      data = await kudosRepo.save(data);
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
      const kudosRepo = AppDataSource.getRepository(Kudos);
      const data = await kudosRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.deletedBy = req.data?.uuid || undefined;
      data.deletedAt = new Date();
      await kudosRepo.save(data);
      utilLib.loggingRes(req, { message: "Kudos deleted successfully" });
      return res.json({ message: "Kudos deleted successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async playerKudosList(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { match_uuid, receiver_uuid, sender_uuid } = req.query;
    if (!match_uuid && !receiver_uuid && !sender_uuid) {
      return res.status(400).json({ message: "One of match_uuid, receiver_uuid, sender_uuid should be not empty" });
    }
    try {
      const playerKudosRepo = AppDataSource.getRepository(PlayerKudos);
      const where: any = {};

      if (match_uuid) where.match_uuid = match_uuid;
      if (receiver_uuid) where.player_uuid = receiver_uuid;
      if (sender_uuid) where.by_uuid = sender_uuid;
      const data = await playerKudosRepo.find({
        where,
        relations: {
          player: true,
          by: true,
          kudos: true,
        },
      });
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async givePlayerKudos(req: any, res: any) {
    const utilLib = Util.getInstance();
    const sender_uuid = req.data?.uuid;
    const { player_uuid, kudos_uuid, match_uuid, kudos_text, kudos_rating } = req.body;
    if (!player_uuid || !kudos_uuid || !match_uuid) {
      return res.status(400).json({ message: "player_uuid, kudos_uuid, match_uuid is required!" });
    }
    try {
      // validate that the match is available and is already ended
      const matchesRepo = AppDataSource.getRepository(Matches);
      const match = await matchesRepo.findOneBy({ uuid: match_uuid, deletedBy: IsNull() });
      if (!match) return res.status(406).json({ message: "Match not found!" });
      if (match.status !== MatchStatus.ENDED) return res.status(406).json({ message: "Match is not ended yet!" });
      
      // validate that the kudos is available
      const kudosRepo = AppDataSource.getRepository(Kudos);
      const kudos = await kudosRepo.findOneBy({ uuid: kudos_uuid, deletedBy: IsNull() });
      if (!kudos) return res.status(406).json({ message: "Kudos not found!" });
      
      // validate that the player is available
      const playerRepo = AppDataSource.getRepository(Player);
      const player = await playerRepo.findOneBy({ uuid: player_uuid, deletedBy: IsNull() });
      if (!player) return res.status(406).json({ message: "Player not found!" });

      AppDataSource.transaction(async (entityManager) => {
        // check if player has already given kudos to the player
        const playerKudosRepo = AppDataSource.getRepository(PlayerKudos);
        const playerKudos = await playerKudosRepo.findOneBy({ player_uuid, by_uuid: sender_uuid, deletedBy: IsNull() });
        if (playerKudos) {
          // update existing kudos
          playerKudos.kudos_text = kudos_text;
          playerKudos.kudos_rating = kudos_rating;
          playerKudos.updatedAt = new Date();
          await entityManager.save(playerKudos);
        } else {
          // create new kudos
          const newPlayerKudos = new PlayerKudos();
          newPlayerKudos.uuid = uuidv4();
          newPlayerKudos.player_uuid = player_uuid;
          newPlayerKudos.by_uuid = sender_uuid;
          newPlayerKudos.kudos_uuid = kudos_uuid;
          newPlayerKudos.match_uuid = match_uuid;
          newPlayerKudos.kudos_text = kudos_text;
          newPlayerKudos.kudos_rating = kudos_rating;
          newPlayerKudos.updatedBy = sender_uuid;
          await entityManager.save(newPlayerKudos);
        }
        utilLib.loggingRes(req, { data: playerKudos, message: "Player kudos given successfully" });
        return res.json({ data: playerKudos, message: "Player kudos given successfully" });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}