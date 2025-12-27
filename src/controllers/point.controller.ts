import { Tournament } from "../entities/Tournament";
import { MatchPoint } from "../entities/MatchPoint";
import { TournamentMatchPoint } from "../entities/TournamentMatchPoint";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { IsNull, Like, Not } from "typeorm";

export default class PointController {
  async create(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { round, point } = req.body;
    try {
      if (!round || !point) {
        throw new Error("All fields are required!");
      }

      // check round and point exists
      const pointRepo = AppDataSource.getRepository(MatchPoint);
      const dataExists = await pointRepo.findOneBy({
        round,
        win_point: point,
        deletedBy: undefined,
      });
      if (dataExists) {
        throw new Error("Point for this round already created!");
      }

      const newData = new MatchPoint();
      newData.uuid = uuidv4();
      newData.round = round;
      newData.win_point = point;
      newData.createdBy = req.data?.uuid || undefined;
      const data = await pointRepo.save(newData);
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
      const pointRepo = AppDataSource.getRepository(MatchPoint);
      const [data, totalRecords] = await pointRepo.findAndCount({
        where: [
          {
            deletedBy: IsNull(),
          },
        ],
      });
      utilLib.loggingRes(req, { data });
      return res.json({
        data,
        totalRecords,
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async update(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { round, point } = req.body;
    const { uuid } = req.params;
    try {
      if (!round || !point) {
        throw new Error("All fields are required!");
      }

      // check round and point exists
      const pointRepo = AppDataSource.getRepository(MatchPoint);
      const dataExists = await pointRepo.findOneBy({
        uuid: uuid,
        round,
        deletedBy: undefined,
      });
      if (!dataExists) {
        throw new Error("Point not found!");
      }
      dataExists.win_point = point;
      const data = await pointRepo.save(dataExists);
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }


// Tournament
  async tcreate(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { round, point } = req.body;
    const { tournament_uuid } = req.params;
    try {
      if (!round || !point) {
        throw new Error("All fields are required!");
      }

      // check Tournament exists
      const tRepo = AppDataSource.getRepository(Tournament);
      const tExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: undefined,
      });
      if (!tExists) {
        throw new Error("Tournament not found!");
      }

      // check round and point exists
      const pointRepo = AppDataSource.getRepository(TournamentMatchPoint);
      const dataExists = await pointRepo.findOneBy({
        round,
        point,
        deletedBy: undefined,
        tournament_uuid
      });
      if (dataExists) {
        throw new Error("Point for this round already created!");
      }

      const newData = new TournamentMatchPoint();
      newData.uuid = uuidv4();
      newData.tournament_uuid = tournament_uuid;
      newData.round = round;
      newData.point = point;
      newData.createdBy = req.data?.uuid || undefined;
      const data = await pointRepo.save(newData);
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async tlist(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { tournament_uuid } = req.params;
    try {
      // check Tournament exists
      const tRepo = AppDataSource.getRepository(Tournament);
      const tExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: undefined,
      });
      if (!tExists) {
        throw new Error("Tournament not found!");
      }

      const pointRepo = AppDataSource.getRepository(TournamentMatchPoint);
      const [data, totalRecords] = await pointRepo.findAndCount({
        where: [
          {
            tournament_uuid,
            deletedBy: undefined,
          },
        ],
      });
      utilLib.loggingRes(req, { data });
      return res.json({
        data,
        totalRecords,
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async tupdate(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { round, point } = req.body;
    const { uuid, tournament_uuid } = req.params;
    try {
      if (!round || !point) {
        throw new Error("All fields are required!");
      }

      // check Tournament exists
      const tRepo = AppDataSource.getRepository(Tournament);
      const tExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: undefined,
      });
      if (!tExists) {
        throw new Error("Tournament not found!");
      }

      // check round and point exists
      const pointRepo = AppDataSource.getRepository(TournamentMatchPoint);
      const dataExists = await pointRepo.findOneBy({
        uuid: uuid,
        round,
        tournament_uuid,
        deletedBy: undefined,
      });
      if (!dataExists) {
        throw new Error("Point not found!");
      }
      dataExists.point = point;
      const data = await pointRepo.save(dataExists);
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
