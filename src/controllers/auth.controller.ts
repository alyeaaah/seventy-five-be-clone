import { Request, Response } from "express";
import { User } from "../entities/User";
import { AppDataSource } from "../data-source";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config";
import Util from "../lib/util.lib";
import { Player } from "../entities/Player";
import { IsNull } from "typeorm";

export default class AuthController {
  async login(req: Request, res: Response) {
    const { username, password } = req.body;
    try {
      if (!username || !password)
        throw new Error("Username and password needed!");
      const userRepository = AppDataSource.getRepository(User);
      const playerRepo = AppDataSource.getRepository(Player);

      const userPlayer = await playerRepo.findOne({
        where: [{
          email: username, 
          deletedAt: IsNull()
        }, {
          username: username, 
          deletedAt: IsNull()
        }, {
          phoneNumber: username, 
          deletedAt: IsNull()
        }],
      }); 
      const userAdmin = await userRepository.findOne({
        where: { username },
      });
      let role;
      let dbPasswd;
      if (!!userPlayer) {
        role = userPlayer.role;
        dbPasswd = userPlayer.password;
      } else if (!!userAdmin) {
        role = userAdmin.role;
        dbPasswd = userAdmin.password;
      } else {
        return res.status(400).json({ message: "Player is not found, please register!" });
      }
      const user = userPlayer || userAdmin;
      
      if (!user) throw new Error("Player is not found, please register!");
      const isMatch = await bcrypt.compare(password, (dbPasswd || ""));
      if (!isMatch) throw new Error("Username or password is incorrect!");

      const payload = {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        role: role,
        name: user.name,
      };
      
      const token = await new Promise((resolve, reject) => {
        jwt.sign(
          payload,
          config.jwtSecret,
          { expiresIn: '1d' },
          (error, token) => {
            if (error) reject(error);
            resolve(token);
          }
        );
      });
      new Util().loggingRes(req, { token });
      return res.json({ token });
    } catch (error: any) {
      new Util().loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
