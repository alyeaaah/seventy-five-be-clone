import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { IsNull, Like, Not } from "typeorm";

import { AppDataSource } from "../data-source";
import { Tournament } from "../entities/Tournament";
import { Rule } from "../entities/Rule";
import { Player } from "../entities/Player";
import { PlayerTeam } from "../entities/PlayerTeam";
import { Team } from "../entities/Team";

export default class TeamController {
  async create(req: any, res: any) {
    const utilLib = new Util();
    const { tournament_uuid, name, players } = req.body;
    try {
      if (!tournament_uuid || !name || !players || players.length !== 2) {
        throw new Error("All fields are required!");
      }

      // check Exist
      let players_ = [];
      const playerRepo = AppDataSource.getRepository(Player);
      for (const p of players) {
        const dataExists = await playerRepo.findOneBy({ uuid: p.uuid });
        if (!dataExists) {
          throw new Error("Player not found!");
        }
        players_.push(dataExists);
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

      // check team name exists
      const teamRepo = AppDataSource.getRepository(Team);
      const teamExists = await teamRepo.findOneBy({ name, tournament_uuid });
      if (teamExists) {
        throw new Error("Team name already exists!");
      }

      const newData = new Team();
      newData.uuid = uuidv4();
      newData.name = name;
      newData.tournament_uuid = tournament_uuid;
      newData.createdBy = req.data?.uuid || undefined;
      const data = await teamRepo.save(newData);

      const teamPlayerRepo = AppDataSource.getRepository(PlayerTeam);
      for (const p of players_) {
        const newPlayerTeam = new PlayerTeam();
        newPlayerTeam.uuid = uuidv4();
        newPlayerTeam.team_uuid = data.uuid;
        newPlayerTeam.player_uuid = p.uuid;
        await teamPlayerRepo.save(newPlayerTeam);
      }
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  // create method to generate teams, based on request body that contain { uuid, players: [{ player_uuid, team_uuid, team_name, team_alias}]} create new team if team_uuid is empty
  async generateTeams(req: any, res: any) {
    const utilLib = new Util();
    const { players } = req.body;
    const { uuid } = req.params;
    try {
      if (!uuid || !players || players.length < 2) {
        throw new Error("Players minimum 2!");
      }
      const playerRepo = AppDataSource.getRepository(Player);
      const teamRepo = AppDataSource.getRepository(Team);
      const teamPlayerRepo = AppDataSource.getRepository(PlayerTeam);
      for (const p of players) {
        const dataExists = await playerRepo.findOneBy({ uuid: p.player_uuid, deletedAt: IsNull() });
        if (!dataExists) {
          throw new Error("Player not found!");
        }
      }
      const newTeams = players.filter((p: any) => !p.team_uuid && !p.isDeleted).map((p: any) => ({
        team_uuid: "",
        team_name: p.team_name,
        team_alias: p.team_alias,
        tournament_uuid: uuid
      }));
      const uniqueTeams = newTeams.filter((p: any, idx: number) => newTeams.findIndex((t: any) => t.team_name === p.team_name && t.team_alias === p.team_alias) === idx);

      let addedTeams = 0;
      let updatedPlayerTeams = 0;
      const successMessages: string[] = [];
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        let idx = 0;
        // start manage teams
        for (const newTeam of uniqueTeams) {
          // check team name exists
          const teamExists = await teamRepo.findOneBy({ name: newTeam.team_name, tournament_uuid: newTeam.tournament_uuid, deletedAt: IsNull() });
          if (teamExists) {
            if (teamExists.alias === newTeam.team_alias) {
              uniqueTeams[idx].uuid = teamExists.uuid;
              successMessages.push(`Team ${newTeam.team_name} ${newTeam.team_alias} already exists!`);
            } else {
              
              uniqueTeams[idx].uuid = teamExists.uuid;
              const oldAlias = teamExists.alias;
              teamExists.alias = newTeam.team_alias;
              await transactionalEntityManager.save(teamExists);
              successMessages.push(`${newTeam.team_name} ${oldAlias} updated to ${newTeam.team_name} ${newTeam.team_alias}!`);
              addedTeams++;
            }
          } else {

            const newData = new Team();
            newData.uuid = uuidv4();
            newData.name = newTeam.team_name;
            newData.alias = newTeam.team_alias;
            newData.tournament_uuid = newTeam.tournament_uuid;
            newData.createdBy = req.data?.uuid || undefined;
            const savedTeam = await transactionalEntityManager.save(newData);
            uniqueTeams[idx].uuid = savedTeam.uuid;
            
            addedTeams++;
          }
          idx++;
        }
        // end manage teams
        for (const deletedPlayer of players.filter((p: any) => !!p.isDeleted)) {
          const player = await teamPlayerRepo.findOneBy({ player_uuid: deletedPlayer.player_uuid, tournament_uuid: uuid, deletedAt: IsNull() });
          if (player) {
            player.deletedAt = new Date();
            player.deletedBy = req.data?.uuid || undefined;
            await transactionalEntityManager.save(player);
            updatedPlayerTeams++;
          }
        }
        // start manage player teams
        for (const p of players.filter((p: any) => !p.isDeleted)) {
          if (!p.team_uuid) {
            // check if data already entered tournament 
            const alreadyJoined = await teamPlayerRepo.findOne({ where: { player_uuid: p.player_uuid, tournament_uuid: uuid, deletedAt: IsNull()}, relations: ["team"] });
            if (!alreadyJoined) {
              const addedTeamUuid = uniqueTeams.find((t: any) => t.team_name === p.team_name && t.team_alias === p.team_alias)?.uuid;
              if (!addedTeamUuid) {
                throw new Error(`Team ${p.team_name} not found on body!`);
              }
              const newPlayerTeam = new PlayerTeam();
              newPlayerTeam.uuid = uuidv4();
              newPlayerTeam.team_uuid = addedTeamUuid;
              newPlayerTeam.player_uuid = p.player_uuid;
              newPlayerTeam.tournament_uuid = uuid;
              newPlayerTeam.createdBy = req.data?.uuid || undefined;
              await transactionalEntityManager.save(newPlayerTeam);
              updatedPlayerTeams++;
            } else {
              if (alreadyJoined.team_uuid != p.team_uuid) {
                // set success message that a player skipped

                const addedTeam = uniqueTeams.find((t: any) => t.team_name === p.team_name && t.team_alias === p.team_alias);
                if (!addedTeam) {
                  throw new Error(`Team ${p.team_name} not found on body!`);
                }
                const dataToUpdate = await teamPlayerRepo.findOneBy({ player_uuid: p.player_uuid, tournament_uuid: uuid, deletedAt: IsNull()});
                if (dataToUpdate) {
                  dataToUpdate.team_uuid = addedTeam.uuid;
                  await transactionalEntityManager.save(dataToUpdate);
                  updatedPlayerTeams++;
                }
                successMessages.push(`Player ${alreadyJoined?.player?.name || p.player_name || p.player_uuid} moved from ${alreadyJoined?.team?.name} ${alreadyJoined?.team?.alias} to ${addedTeam.team_name} ${addedTeam.team_alias} tournament!`);
              } else {
                // set success message that a player skipped
                successMessages.push(`Player ${alreadyJoined?.player?.name || p.player_name || p.player_uuid} skipped, already joined in ${alreadyJoined?.team?.name || p.team_name} tournament!`);
              }
            }
          } else {
            const dataPlayerExists = await teamPlayerRepo.findOne({ where: { player_uuid: p.player_uuid, tournament_uuid: uuid, deletedAt: IsNull()}, relations: ["team", "player"]});
            if (dataPlayerExists && dataPlayerExists.team_uuid != p.team_uuid) {
              const dataToUpdate = await teamPlayerRepo.findOneBy({ player_uuid: p.player_uuid, tournament_uuid: uuid, deletedAt: IsNull()});
              if (dataToUpdate) {
                dataToUpdate.team_uuid = p.team_uuid;
                await transactionalEntityManager.save(dataToUpdate);
                updatedPlayerTeams++;
              }
            } else if (!dataPlayerExists) {
              const newPlayerTeam = new PlayerTeam();
              newPlayerTeam.uuid = uuidv4();
              newPlayerTeam.team_uuid = p.team_uuid;
              newPlayerTeam.player_uuid = p.player_uuid;
              newPlayerTeam.tournament_uuid = uuid;
              newPlayerTeam.createdBy = req.data?.uuid || undefined;
              await transactionalEntityManager.save(newPlayerTeam);
              updatedPlayerTeams++;
            } else if (!!dataPlayerExists && dataPlayerExists.team_uuid == p.team_uuid) {
              successMessages.push(`Player ${dataPlayerExists?.player?.name || p.player_name || p.player_uuid} skipped, already joined ${dataPlayerExists?.team?.name || p.team_name} in tournament!`);
              // do nothing because already added
            } else {
              throw new Error(`Player ${p.player_uuid} already joined tournament!`);
            }
          }
        }
      });
      // get player & teams  based on tournament uuid
      const queryBuilder = teamPlayerRepo
        .createQueryBuilder("playerTeam")
        .select([
          "playerTeam.uuid as uuid",
          "player.uuid as player_uuid",
          "player.name as player_name",
          "player.media_url as media_url",
          "team.uuid as team_uuid",
          "team.name as team_name",
          "team.alias as team_alias"
        ])
        .leftJoin("playerTeam.player", "player")
        .leftJoin("playerTeam.team", "team")
        .where("playerTeam.tournament_uuid = :tournament_uuid", { tournament_uuid: uuid })
        .andWhere("playerTeam.deletedAt IS NULL");      
      const data = await queryBuilder.getRawMany();
      utilLib.loggingRes(req, { data: { players: data, uuid: uuid } }, );
      return res.json({ data: { players: data, uuid: uuid }, messages: successMessages, addedTeams, updatedPlayerTeams, success: true });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async listPlayerTeam(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: uuid,
        deletedAt: IsNull(),
      });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }
      const playerTeamRepo = AppDataSource.getRepository(PlayerTeam);
      const queryBuilder = playerTeamRepo
        .createQueryBuilder("playerTeam")
        .select([
          "playerTeam.uuid as uuid",
          "player.uuid as player_uuid",
          "player.name as player_name",
          "player.media_url as media_url",
          "team.uuid as team_uuid",
          "team.name as team_name",
          "team.alias as team_alias"
        ])
        .leftJoin("playerTeam.player", "player")
        .leftJoin("playerTeam.team", "team")
        .where("playerTeam.tournament_uuid = :tournament_uuid", { tournament_uuid: uuid })
        .andWhere("playerTeam.deletedAt IS NULL")
        .andWhere("player.deletedAt IS NULL")
        .andWhere("player.name IS NOT NULL")
        .orderBy("team.name", "ASC");      
      const data = await queryBuilder.getRawMany();
      
      utilLib.loggingRes(req, {
        data: {
          players: data,
          uuid: uuid
        }
      });
      return res.json({ data: { players: data, uuid: uuid } });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async listTeams(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: uuid,
        deletedBy: IsNull(),
      });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }
      const teamRepo = AppDataSource.getRepository(Team);
      const data = await teamRepo.find({
        where: {
          tournament_uuid: uuid,
          deletedAt: IsNull(),
          deletedBy: IsNull(),
          players: {
            deletedAt: IsNull(),
            player: {
              name: Not(IsNull()),
              deletedAt: IsNull()
            }
          }
        },
        order: {
          name: "ASC"
        },
        relations: ["players", "players.player"]
      });
      const finalData = data.map((team) => ({
        id: team.id,
        uuid: team.uuid,
        name: team.name,
        alias: team.alias,
        players: team.players?.map((player) => ({
          id: player.id,
          uuid: player.uuid,
          name: player.player?.name,
          nickname: player.player?.nickname,
          city: player.player?.city,
          media_url: player.player?.media_url
        }))
      }));
      console.log(data);
      
      utilLib.loggingRes(req, { data: finalData, totalRecords: finalData.length });
      return res.json({ data: finalData, totalRecords: finalData.length });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  
  
  async list(req: any, res: any) {
    const utilLib = new Util();
    const { tournament_uuid } = req.query;
    try {
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: undefined,
      });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }
      const teamRepo = AppDataSource.getRepository(Team);
      const [data, totalRecords] = await teamRepo
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.players", "players")
        .leftJoinAndSelect("players.player", "player")
        .andWhere("team.deletedAt IS NULL")
        .andWhere("team.deletedBy IS NULL")
        .andWhere("team.tournament_uuid = :uuid OR (:uuid IS NULL)", {
          uuid: tournament_uuid,
        })
        .getManyAndCount();
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

  async detail(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const teamRepo = AppDataSource.getRepository(Team);
      const data = await teamRepo
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.players", "players")
        .leftJoinAndSelect("players.player", "player")
        .andWhere("team.deletedAt IS NULL")
        .andWhere("team.deletedBy IS NULL")
        .andWhere("team.uuid = :uuid", { uuid })
        .getOne();
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
    const { name, players } = req.body;
    try {
      if (!name || !players || players.length !== 2) {
        throw new Error("All fields are required!");
      }

      // check Team Exist
      const teamRepo = AppDataSource.getRepository(Team);
      const data = await teamRepo.findOneBy({ uuid });
      if (!data) {
        throw new Error("Team not found!");
      }

      // check Exist
      let players_ = [];
      const playerRepo = AppDataSource.getRepository(Player);
      for (const p of players) {
        const dataExists = await playerRepo.findOneBy({ uuid: p.uuid });
        if (!dataExists) {
          throw new Error("Player not found!");
        }
        players_.push(dataExists);
      }

      // check team name exists
      const teamExists = await teamRepo.findOneBy({
        name,
        tournament_uuid: data.tournament_uuid,
        uuid: Not(data.uuid),
      });
      if (teamExists) {
        throw new Error("Team name already exists!");
      }

      data.name = name;
      await teamRepo.save(data);

      // delete old player
      const teamPlayerRepo = AppDataSource.getRepository(PlayerTeam);
      await teamPlayerRepo
        .createQueryBuilder()
        .delete()
        .from(PlayerTeam)
        .where("team_uuid = :uuid", { uuid: data.uuid })
        .execute();

      // insert new player
      for (const p of players_) {
        const newPlayerTeam = new PlayerTeam();
        newPlayerTeam.uuid = uuidv4();
        newPlayerTeam.team_uuid = data.uuid;
        newPlayerTeam.player_uuid = p.uuid;
        await teamPlayerRepo.save(newPlayerTeam);
      }
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
      const teamRepo = AppDataSource.getRepository(Team);
      let data = await teamRepo.findOneBy({ uuid });
      if (!data) throw new Error(`Data not found`);
      data.deletedAt = new Date();
      data.deletedBy = req.data?.uuid || undefined;
      data = await teamRepo.save(data);
      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
