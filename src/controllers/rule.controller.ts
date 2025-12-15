import { Tournament } from "../entities/Tournament";
import { Rule } from "../entities/Rule";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { Like, Not } from "typeorm";

export default class RuleController {
  async create(req: any, res: any) {
    const utilLib = new Util();
    const { tournament_uuid, description } = req.body;
    try {
      if (!tournament_uuid || !description) {
        throw new Error("All fields are required!");
      }
      // check transaction_uuid exists
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: undefined,
      });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }
      const ruleRepo = AppDataSource.getRepository(Rule);
      const newData = new Rule();
      newData.uuid = uuidv4();
      newData.tournament_uuid = tournament_uuid;
      newData.description = encodeURI(description);
      newData.createdBy = req.data?.uuid || undefined;
      const data = await ruleRepo.save(newData);
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
    const { description } = req.query;
    try {
      if (!description) {
        throw new Error("All fields are required!");
      }
      const ruleRepo = AppDataSource.getRepository(Rule);
      let data = await ruleRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.description = encodeURI(description)
      data = await ruleRepo.save(data);
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
      const ruleRepo = AppDataSource.getRepository(Rule);
      let data = await ruleRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.deletedAt = new Date();
      data.deletedBy = req.data?.uuid || undefined;
      data = await ruleRepo.save(data);
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
