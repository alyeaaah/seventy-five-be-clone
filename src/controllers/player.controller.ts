import { Player, RoleEnum } from "../entities/Player";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { IsNull, Like, MoreThan, Not } from "typeorm";
import bcrypt from "bcryptjs";
import { formatDate, formatDateCompact, calculateAge } from "../lib/date.util";
import { Levels } from "../entities/Levels";
import { registerSchema } from "../schemas/player.schema";
import { League } from "../entities/League";

export default class PlayerController {
  async create(req: any, res: any) {
    const utilLib = Util.getInstance();
    const {
      name,
      username,
      nickname,
      email,
      password,
      phone,
      skills,
      dateOfBirth,
      placeOfBirth,
      height,
      gender,
      playstyleForehand,
      playstyleBackhand,
      turnDate,
      address,
      city,
      level_uuid,
      league_id,
      socialMediaIg,
      socialMediaX,
      media_url,
      avatar_url
    } = req.body;
    try {
      if (!name || !username || !phone || !skills) {
        throw new Error("All fields are required!");
      }
      if(gender && (gender != "m" && gender != "f")) {
        throw new Error("Gender should be m or f!");
      }
      await AppDataSource.transaction(async (entityManager) => {
        // check username exists
        const playerRepo = AppDataSource.getRepository(Player);
        const dataExists = await playerRepo.findOneBy({ username });
        if (dataExists) {
          throw new Error("Username already exists!");
        }
        const hashedPassword: any = await new Promise((resolve, reject) => {
        bcrypt.hash(password || formatDateCompact(dateOfBirth)+height, 10, function (err, hash) {
          if (err) reject(err);
          resolve(hash);
        });
      });
        let newPlayer = new Player();
        newPlayer.uuid = uuidv4();
        newPlayer.name = name;
        newPlayer.nickname = nickname;
        newPlayer.username = username;
        newPlayer.email = email;
        newPlayer.password = hashedPassword;
        newPlayer.phoneNumber = phone;
        newPlayer.address = address;
        newPlayer.city = city;
        newPlayer.skills = JSON.stringify(skills);
        newPlayer.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
        newPlayer.placeOfBirth = placeOfBirth || '';
        newPlayer.turnDate = turnDate ? new Date(turnDate) : null;
        newPlayer.height = height;
        newPlayer.playstyleForehand = playstyleForehand;
        newPlayer.playstyleBackhand = playstyleBackhand;
        newPlayer.isVerified = true;
        newPlayer.gender = gender;
        newPlayer.media_url = media_url;
        newPlayer.avatar_url = avatar_url;
        newPlayer.socialMediaIg = socialMediaIg;
        newPlayer.socialMediaX = socialMediaX;
        newPlayer.level_uuid = level_uuid;
        newPlayer.league_id = league_id;
        newPlayer.createdBy = req.data?.uuid || undefined;
        const data = await entityManager.save(newPlayer);
        const result = {
          ...data,
          skills: JSON.parse(data.skills),
          phone: data.phoneNumber,
          dateOfBirth: formatDate(data.dateOfBirth),
          turnDate: formatDate(data.turnDate),
        }
        utilLib.loggingRes(req, { data: result });
        return res.json({ data: result });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async list(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { attr } = req.params;
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "1");
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const playerRepo = AppDataSource.getRepository(Player);
      let qb = await playerRepo
        .createQueryBuilder("player")
        .leftJoinAndSelect("player.level", "level")
        .where("((player.name LIKE :search AND player.deletedBy IS NULL)", { search: `%${search}%` })
        .orWhere("(player.username LIKE :search AND player.deletedBy IS NULL))", { search: `%${search}%` })
        .orderBy("player.createdAt", "DESC")
        .skip(offset)
        .take(limit);
      if (req.query.featured && req.query.featured == "true") {
        qb = qb.andWhere(`player.featured = 1`);
      }
      if (req.query.level && req.query.level == "true") {
        qb = qb.andWhere(`player.level_uuid = :level_uuid`, { level_uuid: req.query.level });
      }
      
      const [data, totalRecords] = await qb.getManyAndCount();
      const result = data.map((d) => ({
        ...d,
        skills: d.skills ? JSON.parse(d.skills) : undefined,
        phone: d.phoneNumber,
        dateOfBirth: formatDate(d.dateOfBirth),
        turnDate: formatDate(d.turnDate),
        level: d.level ? d.level.name : undefined,
      }));
      const totalPages = Math.ceil(totalRecords / limit);
      utilLib.loggingRes(req, { data: result });
      return res.json ({
        data: result,
        totalRecords,
        totalPages,
        currentPage: page,
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async rank(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { attr } = req.params;
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "1");
      const level = req.query.level || undefined;
      const offset = (page - 1) * limit;
      const search = (req.query.search as string) || "";
      const playerRepo = AppDataSource.getRepository(Player);
      let [data, totalRecords] = await playerRepo.findAndCount({
        where: [
          { name: Like(`%${search}%`), deletedBy: IsNull(), level: { uuid: level } },
          { username: Like(`%${search}%`), deletedBy: IsNull(), level: { uuid: level } },
        ],
        relations: ["level"],
        order: {
          point: "DESC",
        },
        skip: offset,
        take: limit,
      });      
      for (const d of data) {
        d.password = "*****";
      }
      const result = data.map((d) => ({
        ...d,
        skills: d.skills ? JSON.parse(d.skills) : undefined,
        phone: d.phoneNumber,
        dateOfBirth: formatDate(d.dateOfBirth),
        turnDate: formatDate(d.turnDate),
        level: d.level ? d.level.name : undefined,
      }));
      const totalPages = Math.ceil(totalRecords / limit);
      utilLib.loggingRes(req, { data: result });
      return res.json({
        data: result,
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
    const { uuid, attr } = req.params;
    try {
      const playerRepo = AppDataSource.getRepository(Player);
      const data = await playerRepo.findOne({
        where: { uuid, deletedBy: IsNull() },
        relations: {
          level: true,
          league: true,
        }
      });
      if(!data) throw new Error(`Data not found`);
      if(attr == 'public') {
        data.password = "*****";
        data.id = undefined;
      }
      const result = {
        ...data,
        skills: data.skills ? JSON.parse(data.skills) : undefined,
        phone: data.phoneNumber,
        dateOfBirth: formatDate(data.dateOfBirth),
        turnDate: formatDate(data.turnDate),
        level: data.level ? data.level.name : undefined,
      };
      utilLib.loggingRes(req, { data: result });
      return res.json({ data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async update(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const {
      name,
      username,
      nickname,
      password,
      email,
      phoneNumber,
      skills,
      address,
      city,
      dateOfBirth,
      weight,
      gender,
      isVerified,
      placeOfBirth,
      playstyleForehand,
      playstyleBackhand,
      turnDate,
      height,
      socialMediaIg,
      socialMediaX,
      level_uuid,
      league_id,
      media_url,
      avatar_url
    } = req.body;
    try {
      if(password) throw new Error("Password cant be updated!");
      const playerRepo = AppDataSource.getRepository(Player);
      if(username){
        const usernameExist = await playerRepo.findOneBy({ username, uuid: Not(uuid), deletedAt: IsNull() });
        if(usernameExist) throw new Error("Username already exists!");
      }
      if(email){
        const emailExist = await playerRepo.findOneBy({ email, uuid: Not(uuid), deletedAt: IsNull() });
        if(emailExist) throw new Error("Email already exists!");
      }
      if(phoneNumber){
        const phoneExist = await playerRepo.findOneBy({ phoneNumber, uuid: Not(uuid), deletedAt: IsNull() });
        if(phoneExist) throw new Error("Phone Number already exists!");
      }
      if(gender && (gender != "m" && gender != "f")) {
        throw new Error("Gender should be m or f!");
      }

      let data = await playerRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);      
      data.name = name || data.name;
      data.username = username || data.username;
      data.email = email || data.email;
      data.nickname = nickname || data.nickname;
      data.phoneNumber = phoneNumber || data.phoneNumber;
      data.skills = JSON.stringify(skills) || data.skills;
      data.address = address || data.address;
      data.city = city || data.city;
      data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : data.dateOfBirth;
      data.height = weight || data.height;
      data.gender = gender || data.gender;
      data.isVerified = isVerified == "true" ? true : false || data.isVerified;
      data.placeOfBirth = placeOfBirth || data.placeOfBirth;
      data.turnDate = turnDate ? new Date(turnDate) : data.turnDate;
      data.height = height || data.height;
      data.playstyleForehand = playstyleForehand;
      data.playstyleBackhand = playstyleBackhand;
      data.socialMediaIg = socialMediaIg || data.socialMediaIg;
      data.socialMediaX = socialMediaX || data.socialMediaX;
      data.level_uuid = level_uuid || data.level_uuid;
      data.league_id = league_id || data.league_id;
      data.media_url = media_url || data.media_url;
      data.avatar_url = avatar_url || data.avatar_url;
      const savedData = await playerRepo.save(data);
      const result = {
        ...savedData,
        skills: JSON.parse(data.skills),
        phone: data.phoneNumber,
        dateOfBirth: formatDate(data.dateOfBirth),
        turnDate: formatDate(data.turnDate),
      }
      utilLib.loggingRes(req, { data: result, message: "Player updated successfully" });
      return res.json({ data: result, message: "Player updated successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async updateRole(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { role } = req.body;
    try {
      const playerRepo = AppDataSource.getRepository(Player);
      const data = await playerRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.role = role as RoleEnum;
      const savedData = await playerRepo.save(data);
      const result = {
        ...savedData,
        skills: data.skills ? JSON.parse(data.skills): undefined,
        phone: data.phoneNumber,
        dateOfBirth: formatDate(data.dateOfBirth),
        turnDate: formatDate(data.turnDate),
      }
      utilLib.loggingRes(req, { data: result, message: "Player updated successfully" });
      return res.json({ data: result, message: "Player updated successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async delete(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const playerRepo = AppDataSource.getRepository(Player);
      const data = await playerRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.deletedAt = new Date();
      data.deletedBy = req.data?.uuid || undefined;
      await playerRepo.save(data);
      utilLib.loggingRes(req, { message: `Data deleted successfully` });
      return res.json({ message: `Data deleted successfully` });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async toggleFeatured(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const playerRepo = AppDataSource.getRepository(Player);
      const data = await playerRepo.findOneBy({ uuid, deletedAt: IsNull() });
      
      if (!data) throw new Error(`Player not found`);
      
      data.pinned_at = !data.pinned_at ? new Date() : undefined;
      
      await playerRepo.save(data);
      utilLib.loggingRes(req, { message: "Player pinned status toggled successfully" });
      return res.json({ message: "Player pinned status toggled successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async publicRegistration(req: any, res: any) {
    const utilLib = Util.getInstance();
    const validatedBody = registerSchema.safeParse(req.body);
    if (validatedBody.error) {
      return res.status(400).json({ message: "Invalid registration data", errors: validatedBody.error?.issues.map((e) => e.path + ': ' + e.message) });
    }
    const body = validatedBody.data;

      await AppDataSource.transaction(async (entityManager) => {
        // check username exists
        const playerRepo = AppDataSource.getRepository(Player);
        const dataExists = await playerRepo.findOne({
          where: [
            { username: body.username, deletedAt: IsNull() },
            { email: body.email, deletedAt: IsNull() },
            { phoneNumber: body.phone, deletedAt: IsNull() },
          ]
        });
        if (dataExists) {
          return res.status(400).json({ message: "Username or Email or Phone Number already exists!" });
        }
        const hashedPassword: any = await new Promise((resolve, reject) => {
        bcrypt.hash(body.password, 10, function (err, hash) {
          if (err) reject(err);
          resolve(hash);
        });
      });
        let newPlayer = new Player();
        newPlayer.uuid = uuidv4();
        newPlayer.isVerified = false;
        newPlayer.createdBy = req.data?.uuid || undefined;
        
        newPlayer.name = body.name;
        newPlayer.username = body.username;
        newPlayer.email = body.email;
        newPlayer.password = hashedPassword;
        newPlayer.phoneNumber = body.phone;
        newPlayer.gender = body.gender;
        newPlayer.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
        newPlayer.placeOfBirth = body.placeOfBirth;
        
        const data = await entityManager.save(newPlayer);
        const result = {
          ...data,
          skills: data.skills ? JSON.parse(data.skills) : undefined,
          password: "*****",
          confirmPassword: "*****",
          phone: data.phoneNumber,
          dateOfBirth: formatDate(data.dateOfBirth),
          turnDate: formatDate(data.turnDate),
        }
        utilLib.loggingRes(req, {message: "Player registered successfully", data: result });
        return res.json({ message: "Player registered successfully", data: result });
      });
  }

  async featured(req: any, res: any) {
    const utilLib = Util.getInstance();
    try {
      const playerRepo = AppDataSource.getRepository(Player);
      // use queryBuilder
      const qb = playerRepo.createQueryBuilder("player")
        .leftJoinAndSelect("player.level", "level")
        .where("player.deletedBy IS NULL")
        .andWhere("player.pinned_at IS NOT NULL")
        .orderBy("player.pinned_at", "DESC")
        .addOrderBy("player.createdAt", "ASC");
      let [data] = await qb.getManyAndCount();
      if (!data) throw new Error("Data not found");
      if (data?.length == 0) {
        const qb = playerRepo.createQueryBuilder("player")
          .leftJoinAndSelect("player.level", "level")
          .where("player.deletedBy IS NULL")
          .orderBy("player.point", "DESC")
          .limit(5);
        [data] = await qb.getManyAndCount();
      }
      const result = data.map((d) => ({
        ...d,
        password: "*****",
        skills: d.skills ? JSON.parse(d.skills) : undefined,
        phone: d.phoneNumber,
        dateOfBirth: formatDate(d.dateOfBirth),
        turnDate: formatDate(d.turnDate),
        level: d.level ? d.level.name : undefined,
      }));
      utilLib.loggingRes(req, { data: result });
      return res.json({ data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async publicDetail(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid, attr } = req.params;
    try {
      const playerRepo = AppDataSource.getRepository(Player);
      const data = await playerRepo.findOne(
        { 
          where: { uuid, deletedBy: IsNull() },
          relations: {
            level: true,
            league: true,
          }
        });
      if(!data) throw new Error(`Data not found`);
      if(attr == 'public') {
        data.password = "*****";
        data.id = undefined;
      }
      const result = {
        ...data,
        password: "*****",
        skills: data.skills ? JSON.parse(data.skills) : undefined,
        phone: '00000000',
        phoneNumber: 88888888,
        address: '*****',
        email: 'hidden_email@seventy.five',
        username: '********',
        dateOfBirth: formatDate(data.dateOfBirth),
        turnDate: formatDate(data.turnDate),
        level: data.level ? data.level.name : undefined,
      };
      utilLib.loggingRes(req, { data: result });
      return res.json({ data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async publicStandings(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { limit = 30, level, league } = req.query;
    
    if (!level && !league) {
      return res.status(400).json({ message: "Level or League is required!" });
    }
    try {
      const playerRepo = AppDataSource.getRepository(Player);
      const levelRepo = AppDataSource.getRepository(Levels);
      const whereClause: { level_uuid?: string, league_id?: number } = {};

      if (level) {
        const foundLevel = await levelRepo.findOneBy({
          name: level || "",
          deletedBy: IsNull(),
        });
        if (!foundLevel) return res.status(400).json({ message: "Level not found!" });

        whereClause.level_uuid = foundLevel.uuid;
      }
      if (league) {
        const leagueRepo = AppDataSource.getRepository(League);
        const foundLeague = await leagueRepo.findOneBy({
          name: league || "",
          deletedBy: IsNull(),
        });
        if (!foundLeague) return res.status(400).json({ message: "League not found!" });
        whereClause.league_id = foundLeague.id;
      }

      const data = await playerRepo.find({
        where: {
          deletedBy: IsNull(),
          ...whereClause,
        },
        relations: {
          level: true,
          league: true,
        },
        order: {
          point: "DESC",
        },
      });
      const result = data.map((d) => ({
        ...d,
        password: "*****",
        skills: d.skills ? JSON.parse(d.skills) : undefined,
        phone: '00000000',
        phoneNumber: 88888888,
        address: '*****',
        email: 'hidden_email@seventy.five',
        username: '********',
        dateOfBirth: '*****',
        age: calculateAge(d.dateOfBirth),
        turnDate: formatDate(d.turnDate),
        level: d.level ? d.level.name : undefined,
      }));
      utilLib.loggingRes(req, { data: result });
      return res.json({ data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async publicRank(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { limit = 30 } = req.query;
    const { player_uuid } = req.params;
    if (!player_uuid) {
      return res.status(400).json({ message: "Player is required!" });
    }
    try {
      const playerRepo = AppDataSource.getRepository(Player);
      const playerInfo = await playerRepo.findOne({
        where: { uuid: player_uuid, deletedBy: IsNull() },
        relations: {
          level: true,
        },
      });
      if (!playerInfo) return res.status(400).json({ message: "Player not found!" });
      const rankPosition = await playerRepo.count({
        where: {
          deletedBy: IsNull(),
          level_uuid: playerInfo.level_uuid,
          point: MoreThan(playerInfo.point),
        },
      });
      const result = {
        level: playerInfo.level?.name,
        position: (rankPosition || 0) + 1,
      };
      utilLib.loggingRes(req, { data: result });
      return res.json({ data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
