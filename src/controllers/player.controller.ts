import { Player, RoleEnum } from "../entities/Player";
import { AppDataSource } from "../data-source";
import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { IsNull, Like, MoreThan, Not } from "typeorm";
import bcrypt from "bcryptjs";
import { formatDate, formatDateCompact, calculateAge } from "../lib/date.util";
import { Levels } from "../entities/Levels";
import { registerSchema, updateAccessPayloadSchema } from "../schemas/player.schema";
import { League } from "../entities/League";
import { EmailVerification } from "../entities/EmailVerification";
import { emailService } from "../services/email.service";
import { DraftPick, DraftPickStatus } from "../entities/DraftPick";
import { Team } from "../entities/Team";
import { PlayerTeam } from "../entities/PlayerTeam";
import { Tournament } from "../entities/Tournament";

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
        bcrypt.hash(password || "75TennisClub"+nickname, 10, function (err, hash) {
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

  async quickCreate(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { name, nickname, gender, password, level_uuid, league_id } = req.body;
    try {
      if (!name || !nickname || !gender || !league_id) {
        throw new Error("All fields are required!");
      }
      if (gender && gender != "m" && gender != "f") {
        throw new Error("Gender should be m or f!");
      }

      await AppDataSource.transaction(async (entityManager) => {
        const playerRepo = entityManager.getRepository(Player);

        const baseUsername = (nickname || name)
          .toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "");

        let username = `${baseUsername || "player"}${Math.floor(1000 + Math.random() * 9000)}`;
        for (let i = 0; i < 10; i++) {
          const exists = await playerRepo.findOne({ where: { username } });
          if (!exists) break;
          username = `${baseUsername || "player"}${Math.floor(1000 + Math.random() * 9000)}${i}`;
          if (i === 9) {
            username = `${baseUsername || "player"}${uuidv4().replace(/-/g, "").slice(0, 8)}`;
            const existsFinal = await playerRepo.findOne({ where: { username } });
            if (existsFinal) {
              throw new Error("Failed to generate unique username!");
            }
          }
        }

        const hashedPassword: any = await new Promise((resolve, reject) => {
          bcrypt.hash(password || nickname, 10, function (err, hash) {
            if (err) reject(err);
            resolve(hash);
          });
        });

        const newPlayer = new Player();
        newPlayer.uuid = uuidv4();
        newPlayer.name = name;
        newPlayer.nickname = nickname;
        newPlayer.username = username;
        newPlayer.email = `${username}@seventyfive.club`;
        newPlayer.password = hashedPassword;
        newPlayer.phoneNumber = ``;
        newPlayer.skills = JSON.stringify({});
        newPlayer.placeOfBirth = "";
        newPlayer.isVerified = false;
        newPlayer.gender = gender;
        newPlayer.level_uuid = level_uuid;
        newPlayer.league_id = league_id;
        newPlayer.createdBy = req.data?.uuid || undefined;

        const data = await entityManager.save(newPlayer);
        const result = {
          ...data,
          skills: data.skills ? JSON.parse(data.skills) : undefined,
          phone: data.phoneNumber,
          dateOfBirth: formatDate(data.dateOfBirth),
          turnDate: formatDate(data.turnDate),
        };
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
        
        // Generate verification code and send email
        const verificationCode = uuidv4().replace(/-/g, '').substring(0, 8);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        const verificationRepo = entityManager.getRepository(EmailVerification);
        const emailVerification = new EmailVerification();
        emailVerification.playerId = data.id!;
        emailVerification.code = verificationCode;
        emailVerification.expiresAt = expiresAt;
        emailVerification.isUsed = false;
        
        await verificationRepo.save(emailVerification);
        
        // Send confirmation email asynchronously (don't wait for it to complete)
        emailService.sendConfirmationEmail(
          data.email,
          data.name,
          verificationCode
        ).catch((error: any) => {
          console.error('Failed to send confirmation email:', error);
        });
        
        const result = {
          ...data,
          skills: data.skills ? JSON.parse(data.skills) : undefined,
          password: "*****",
          confirmPassword: "*****",
          phone: data.phoneNumber,
          dateOfBirth: formatDate(data.dateOfBirth),
          turnDate: formatDate(data.turnDate),
        }
        utilLib.loggingRes(req, {message: "Player registered successfully. Please check your email for verification.", data: result });
        return res.json({ message: "Player registered successfully. Please check your email for verification.", data: result });
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
        .andWhere("player.deletedAt IS NULL")
        .andWhere("player.pinned_at IS NOT NULL")
        .orderBy("player.createdAt", "DESC")
        .addOrderBy("player.pinned_at", "DESC")
        .addOrderBy("player.point", "DESC");
      let [data] = await qb.getManyAndCount();
      if (!data) throw new Error("Data not found");
      if (data?.length == 0) {
        const qb = playerRepo.createQueryBuilder("player")
          .leftJoinAndSelect("player.level", "level")
          .where("player.deletedBy IS NULL")
          .andWhere("player.deletedAt IS NULL")
          .orderBy("player.createdAt", "DESC")
          .addOrderBy("player.point", "DESC")
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
          name: level.trim() || "",
          deletedBy: IsNull(),
        });
        if (!foundLevel) return res.status(400).json({ message: "Level not found!" });

        whereClause.level_uuid = foundLevel.uuid;
      }
      if (league) {
        const leagueRepo = AppDataSource.getRepository(League);
        const foundLeague = await leagueRepo.findOneBy({
          name: league.trim() || "",
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

  async updateAccess(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    
    try {
      // Check if the requester is an admin
      console.log(req.data);
      
      if (req.data.role !== 'ADMIN' && req.data.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      // Validate request body
      const validationResult = updateAccessPayloadSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const { username, email, password, isReferee } = validationResult.data;

      const playerRepo = AppDataSource.getRepository(Player);
      const player = await playerRepo.findOneBy({ uuid });
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Check if username is already taken by another player
      const existingUsername = await playerRepo.findOneBy({ 
        username, 
        uuid: Not(player.uuid) 
      });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email is already taken by another player
      const existingEmail = await playerRepo.findOneBy({ 
        email, 
        uuid: Not(player.uuid) 
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash the password using the same pattern as existing code
      const hashedPassword: any = await new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, function (err, hash) {
          if (err) reject(err);
          resolve(hash);
        });
      });

      // Update player fields
      player.username = username;
      player.email = email;
      player.password = hashedPassword;
      player.isReferee = isReferee;

      const savedPlayer = await playerRepo.save(player);

      const result = {
        ...savedPlayer,
        skills: savedPlayer.skills ? JSON.parse(savedPlayer.skills) : undefined,
        phone: savedPlayer.phoneNumber,
        dateOfBirth: formatDate(savedPlayer.dateOfBirth),
        turnDate: formatDate(savedPlayer.turnDate),
        password: undefined // Don't return password in response
      };

      utilLib.loggingRes(req, { data: result, message: "Player access updated successfully" });
      return res.json({ data: result, message: "Player access updated successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async getTournamentJoinStatus(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const playerUuid = req.data?.uuid; // Get current player from auth middleware
    
    try {
      if (!playerUuid) {
        throw new Error("Player authentication required!");
      }

      const playerTeamRepo = AppDataSource.getRepository(PlayerTeam);
      const tourneyRepo = AppDataSource.getRepository(Tournament);
      const tournamentData = await tourneyRepo.findOne({
        where: { 
          uuid: uuid,
          deletedAt: IsNull() 
        }
      });
      if (!tournamentData) {
        throw new Error("Tournament not found!");
      }
      const playerTeam = await playerTeamRepo.findOne({
        where: { 
          player_uuid: playerUuid,
          tournament_uuid: uuid,
          deletedAt: IsNull() 
        },
        relations: {
          player: true,
          team: true
        }
      });
      let draftPick;
      if (tournamentData.draft_pick) {
        const draftPickRepo = AppDataSource.getRepository(DraftPick);
        draftPick = await draftPickRepo.findOne({
          where: { 
            player_uuid: playerUuid,
            tournament_uuid: uuid,
            deletedAt: IsNull() 
          },
        });
      }

      const result = {
        hasJoined: !!playerTeam,
        status: playerTeam?.status || null,
        teamUuid: playerTeam?.team_uuid || null,
        teamName: playerTeam?.team?.name || null,
        joinedAt: playerTeam?.createdAt || null,
        draftPick
      };

      utilLib.loggingRes(req, { data: result });
      return res.json({ data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async getDraftPickTurn(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const playerUuid = req.data?.uuid; // Get current player from auth middleware
    
    try {
      if (!playerUuid) {
        throw new Error("Player authentication required!");
      }

      const draftPickRepo = AppDataSource.getRepository(DraftPick);
      
      // Find current picking player
      const currentPickingPlayer = await draftPickRepo.findOne({
        where: { 
          tournament_uuid: uuid,
          status: DraftPickStatus.PICKING,
          deletedAt: IsNull() 
        },
        relations: {
          player: true
        }
      });

      // Find player's own draft pick status
      const playerDraftPick = await draftPickRepo.findOne({
        where: { 
          tournament_uuid: uuid,
          player_uuid: playerUuid,
          deletedAt: IsNull() 
        },
        relations: {
          player: true
        },
        order: {
          position: 'ASC'
        }
      });

      // Get all available seeded players for picking
      const availableSeededPlayers = await draftPickRepo.find({
        where: { 
          tournament_uuid: uuid,
          seeded: true,
          drafted_by: "",
          deletedAt: IsNull() 
        },
        relations: {
          player: true
        },
        order: {
          position: 'ASC'
        }
      });

      const result = {
        isPlayerTurn: currentPickingPlayer?.player_uuid === playerUuid,
        currentPickingPlayer: currentPickingPlayer ? {
          uuid: currentPickingPlayer.player_uuid,
          name: currentPickingPlayer.player?.name,
          nickname: currentPickingPlayer.player?.nickname,
          pickingSince: currentPickingPlayer.pickingAt
        } : null,
        playerStatus: playerDraftPick ? {
          status: playerDraftPick.status,
          position: playerDraftPick.position,
          seeded: playerDraftPick.seeded,
          draftedBy: playerDraftPick.drafted_by,
          partnerUuid: playerDraftPick.drafted_by || null
        } : null,
        availableSeededPlayers: availableSeededPlayers.map(player => ({
          uuid: player.player_uuid,
          name: player.player?.name,
          nickname: player.player?.nickname,
          position: player.position
        }))
      };

      utilLib.loggingRes(req, { data: result });
      return res.json({ data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async getTournamentDraftPicks(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const draftPickRepo = AppDataSource.getRepository(DraftPick);
      const draftPicks = await draftPickRepo.find({
        where: { 
          tournament_uuid: uuid,
          deletedAt: IsNull(),
          drafted_by: ""
        },
        relations: {
          player: true
        },
        order: {
          position: 'ASC',
          createdAt: 'ASC'
        }
      });
      const result = draftPicks.map((pick) => ({
        ...pick,
        name:pick.player?.name,
        nickname: pick.player?.nickname,
        username: pick.player?.username,
        email:pick.player?.username
        
      }));

      utilLib.loggingRes(req, { data: result });
      return res.json({ data: result });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async addTournamentDraftPick(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { teams } = req.body;
    
    try {
      // Validation
      if (!teams || !Array.isArray(teams) || teams.length === 0) {
        throw new Error("teams array is required");
      }

      await AppDataSource.transaction(async (em) => {
        const draftPickRepo = em.getRepository(DraftPick);
        const savedDraftPicks = [];

        // Process each team in the array
        for (const team of teams) {
          const { player_uuid, team_uuid, position, status, seeded } = team;
          
          // Validate required fields for each team
          if (!player_uuid || position === undefined || position === null || !status) {
            throw new Error("player_uuid, position, and status are required for each team");
          }

          // Check if position already exists for this tournament
          const existingPick = await draftPickRepo.find({
            where: {
              tournament_uuid: uuid,
              deletedAt: IsNull()
            }
          });
          let updatedPosition: number = position;
          if (existingPick.find(p=>p.player_uuid == player_uuid)) {
            throw new Error("Player already exists in this tournament");
          }

          if (existingPick.find(pick => pick.position === position && pick.seeded === seeded)) {
            updatedPosition = (existingPick.filter(ep=>ep.seeded === seeded).sort((a, b) => a.position - b.position).pop()?.position || position) + 1;
          }

          // Create new draft pick
          const newDraftPick = new DraftPick();
          newDraftPick.player_uuid = player_uuid;
          newDraftPick.teams_uuid = team_uuid || undefined;
          newDraftPick.tournament_uuid = uuid;
          newDraftPick.position = updatedPosition || position;
          newDraftPick.status = status;
          newDraftPick.seeded = seeded || false;
          newDraftPick.updatedBy = req.data?.uuid || null;

          const savedDraftPick = await draftPickRepo.save(newDraftPick);
          savedDraftPicks.push(savedDraftPick);
        }

        utilLib.loggingRes(req, { data: savedDraftPicks, message: `${savedDraftPicks.length} draft picks added successfully` });
        return res.json({ data: savedDraftPicks, message: `${savedDraftPicks.length} draft picks added successfully` });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async updateTournamentDraftPickPosition(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { players } = req.body;
    
    try {
      if (!uuid) {
        throw new Error("Tournament UUID is required!");
      }

      if (!players || !Array.isArray(players) || players.length === 0) {
        throw new Error("Players array is required!");
      }

      await AppDataSource.transaction(async (em) => {
        const draftPickRepo = em.getRepository(DraftPick);
        const updatedDraftPicks = [];

        // Process each player in the array
        for (const playerData of players) {
          const { id, player_uuid, position, status, seeded } = playerData;

          // Validate required fields
          if (!id || !player_uuid || !position) {
            throw new Error("ID, player_uuid, and position are required for all players!");
          }

          // Find existing draft pick
          const existingDraftPick = await draftPickRepo.findOne({
            where: { 
              id: id,
              tournament_uuid: uuid,
              player_uuid:player_uuid,
              deletedAt: IsNull() 
            }
          });

          if (!existingDraftPick) {
            throw new Error(`Draft pick with ID ${id} not found for this tournament!`);
          }

          // Update the draft pick
          existingDraftPick.position = position;
          existingDraftPick.status = status;
          existingDraftPick.seeded = seeded;
          existingDraftPick.updatedBy = req.data?.uuid || null;

          const savedDraftPick = await draftPickRepo.save(existingDraftPick);
          updatedDraftPicks.push(savedDraftPick);
        }

        utilLib.loggingRes(req, { data: updatedDraftPicks, message: `${updatedDraftPicks.length} draft pick positions updated successfully` });
        return res.json({ data: updatedDraftPicks, message: `${updatedDraftPicks.length} draft pick positions updated successfully` });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async startDraftPick(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    
    try {
      if (!uuid) {
        throw new Error("Tournament UUID is required!");
      }

      await AppDataSource.transaction(async (em) => {
        const draftPickRepo = em.getRepository(DraftPick);
        
        // Find the player with seeded field 0, sort by position desc 
        const players = await draftPickRepo.find({
          where: { 
            tournament_uuid: uuid,
            seeded: false,
            deletedAt: IsNull() 
          },
          order: { position: "DESC" }
        });

        if (players.length === 0) {
          throw new Error("No player found with seeded field 0!");
        }
        
        const lastPlayer = players[0];
        lastPlayer.status = DraftPickStatus.PICKING;
        lastPlayer.pickingAt = new Date();
        await em.save(lastPlayer);


        utilLib.loggingRes(req, { message: "Draft pick session started successfully" });
        return res.json({ message: "Draft pick session started successfully" });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async assignDraftPick(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid: tournamentUuid } = req.params;
    const { player_uuid, partner_uuid } = req.body;
    
    try {
      if (!tournamentUuid) {
        throw new Error("Tournament UUID is required!");
      }

      if (!player_uuid || !partner_uuid) {
        throw new Error("Player UUID and partner UUID are required!");
      }

      if (player_uuid === partner_uuid) {
        throw new Error("Player and partner cannot be the same!");
      }

      await AppDataSource.transaction(async (em) => {
        const draftPickRepo = em.getRepository(DraftPick);
        const teamRepo = em.getRepository(Team);
        const playerTeamRepo = em.getRepository(PlayerTeam);
        
        // Find the player who is picking
        // Find the partner (seeded player)
        const [pickingPlayer, partnerPlayer, pickingPlayerTeam, partnerPlayerTeam] = await Promise.all([
          draftPickRepo.findOne({
            where: { 
              tournament_uuid: tournamentUuid,
              player_uuid: player_uuid,
              seeded:false,
              deletedAt: IsNull() 
            }
          }),
          draftPickRepo.findOne({
            where: { 
              tournament_uuid: tournamentUuid,
              player_uuid: partner_uuid,
              seeded: true,
              deletedAt: IsNull() 
            }
          }),
          playerTeamRepo.findOne({
            where: {
              player_uuid: player_uuid,
              tournament_uuid: tournamentUuid,
              deletedAt: IsNull()
            }
          }),
          playerTeamRepo.findOne({
            where: {
              player_uuid: partner_uuid,
              tournament_uuid: tournamentUuid,
              deletedAt: IsNull()
            }
          })
        ]);

        if (!pickingPlayer) {
          throw new Error("Picking player not found!");
        }
        if (!partnerPlayer) {
          throw new Error("Partner player not found!");
        }
        if (partnerPlayer.drafted_by.length > 2) {
          throw new Error("Partner player already selected!");
        }
        if (!partnerPlayerTeam) {
          throw new Error("Partner player team not found!");
        }
        if (!pickingPlayerTeam) {
          throw new Error("Picking player team not found!");
        }

        // Update picking player status to PICKED and set drafted_by
        pickingPlayer.status = DraftPickStatus.PICKED;
        pickingPlayer.drafted_by = partner_uuid;
        pickingPlayer.updatedBy = req.data?.uuid || null;

        // Update partner player status to PICKED and set drafted_by
        partnerPlayer.status = DraftPickStatus.PICKED;
        partnerPlayer.drafted_by = player_uuid;
        partnerPlayer.updatedBy = req.data?.uuid || null;
        const teamUuid = uuidv4()
        partnerPlayerTeam.team_uuid = pickingPlayerTeam.team_uuid || teamUuid;
        partnerPlayerTeam.captain = true;
        pickingPlayerTeam.captain = false;
        pickingPlayerTeam.team_uuid = pickingPlayerTeam.team_uuid || teamUuid;
        await Promise.all([
          draftPickRepo.save(pickingPlayer),
          draftPickRepo.save(partnerPlayer),
          playerTeamRepo.save(partnerPlayerTeam),
          playerTeamRepo.save(pickingPlayerTeam)
        ]);

        // Create team record// Check if team UUID already exists
        const createdTeamUuid = pickingPlayerTeam.team_uuid || teamUuid;
        const existingTeam = await teamRepo.findOne({
          where: {
            uuid: createdTeamUuid,
            deletedAt: IsNull()
          }
        });
        
        // Get current teams count for naming
        const currentTeams = await teamRepo.find({
          where: {
            tournament_uuid: tournamentUuid,
            deletedAt: IsNull()
          }
        });
        let savedTeam;

        if (!existingTeam) {
          const team = new Team();
          team.uuid = createdTeamUuid;
          team.tournament_uuid = tournamentUuid;
          
          // Generate unique team name
          let teamNumber = currentTeams.length + 1;
          let teamName = `Team ${teamNumber}`;
          
          // Check if team name already exists and increment if needed
          const existingTeamWithName = await teamRepo.findOne({
            where: {
              name: teamName,
              tournament_uuid: tournamentUuid,
              deletedAt: IsNull()
            }
          });
          
          if (existingTeamWithName) {
            // Find the next available team number
            const usedNumbers = currentTeams
              .filter(t => t.name.startsWith('Team '))
              .map(t => {
                const match = t.name.match(/Team (\d+)/);
                return match ? parseInt(match[1]) : 0;
              })
              .sort((a, b) => b - a);
            
            teamNumber = usedNumbers.length > 0 ? usedNumbers[0] + 1 : currentTeams.length + 1;
            teamName = `Team ${teamNumber}`;
          }
          
          team.name = teamName;
          team.createdBy = 'admin';
          savedTeam = await teamRepo.save(team);
        }

        // start update next draftpick picking
         const nextPlayers = await draftPickRepo.find({
          where: { 
            tournament_uuid: tournamentUuid,
            seeded: false,
            drafted_by: "",
            status: DraftPickStatus.AVAILABLE,
            deletedAt: IsNull() 
          },
          order: { position: "DESC" }
        });

        if (nextPlayers.length > 0) {
          const lastPlayer = nextPlayers[0];
          lastPlayer.status = DraftPickStatus.PICKING;
          lastPlayer.pickingAt = new Date();
          await em.save(lastPlayer);
        }

        
        
        utilLib.loggingRes(req, { 
          data: { 
            team: savedTeam,
            pickingPlayer,
            partnerPlayer
          }, 
          message: "Draft pick partner assigned successfully" 
        });
        return res.json({ 
          data: { 
            team: savedTeam,
            pickingPlayer,
            partnerPlayer
          }, 
          message: "Draft pick partner assigned successfully" 
        });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
