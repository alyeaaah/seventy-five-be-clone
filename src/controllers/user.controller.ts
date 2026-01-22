import { User } from "../entities/User";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { Player } from "../entities/Player";

export default class UserController {
  async get(req: any, res: any) {
    const utilLib = Util.getInstance();
    try {
      const userRepo = AppDataSource.getRepository(User);
      const playerRepo = AppDataSource.getRepository(Player);
      if (req.data.role == "admin") {
        const data = await userRepo.findOneBy({ uuid: req.data.uuid });
        utilLib.loggingRes(req, { data });
        if(data && data.password){
          data.password = "*****";
          
        }
        const resData = {...data, isReferee :true}
        return res.json({data: resData});
      } else {
        const data = await playerRepo.findOneBy({ uuid: req.data.uuid });
        if (!data) {
          throw Error("User not found");
        }
        const resultData = {
          id: data.id,
          uuid: data.uuid,
          name: data.name,
          username: data.username,
          isBlocked: !!data.deletedAt,
          isReferee: data.isReferee,
          role: data.role.toLowerCase(),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          lastLogin: new Date(),
          createdBy: data.createdBy,
        }

        utilLib.loggingRes(req, { data });
        if(data && data.password){
          data.password = "*****";
        }
        return res.json({data: resultData});
      }
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json(error.message);
    }
  }
}
