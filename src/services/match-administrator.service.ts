import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { EntityManager, In, IsNull, MoreThanOrEqual } from "typeorm";

import { AppDataSource } from "../data-source";
import { Tournament } from "../entities/Tournament";
import { Team } from "../entities/Team";
import { Matches, MatchStatus } from "../entities/Matches";
import RedisLib from "../lib/redis.lib";
import { PlayerTeam } from "../entities/PlayerTeam";
import { TournamentGroup } from "../entities/TournamentGroups";
import { UpdateGroupPayloadData, updateGroupPayloadSchema, updateTeamGroupOnlyPayloadSchema } from "../schemas/tournament.schema";
import { updateMatchPayloadSchema, updateMultipleMatchesPayloadSchema, UpdateMatchPayload } from "../schemas/match.schema";

export class MatchAdministratorService {
  async create(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { tournament_uuid, home_team_uuid, away_team_uuid, round } = req.body;
    try {
      if (!tournament_uuid || !home_team_uuid || !away_team_uuid || !round) {
        throw new Error("All fields are required!");
      }

      // check Exist
      const teams = [
        { uuid: home_team_uuid, corner: "home" },
        { uuid: away_team_uuid, corner: "away" },
      ];
      const teamRepo = AppDataSource.getRepository(Team);
      for (const p of teams) {
        const dataExists = await teamRepo.findOneBy({ uuid: p.uuid });
        if (!dataExists) {
          throw new Error("Team UUID not found!");
        }
      }

      // check tournament_uuid exists
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: undefined,
      });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }
      const matchesRepo = AppDataSource.getRepository(Matches);
      const newData = new Matches();
      newData.uuid = uuidv4();
      newData.tournament_uuid = tournament_uuid;
      newData.home_team_uuid = home_team_uuid;
      newData.away_team_uuid = away_team_uuid;
      newData.round = round;
      newData.createdBy = req.data?.uuid || undefined;
      const data = await matchesRepo.save(newData);

      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      console.log(error);

      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async createMultiple(req: any, res: any) {
    const redisLib = RedisLib.getInstance();
    const utilLib = Util.getInstance();
    const { tournament_uuid, matches } = req.body;
    try {
      // check tournament_uuid exists
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: IsNull(),
      });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }
      await AppDataSource.transaction(async (em) => {
        // check tournament_uuid exists in redis
        const exist = await redisLib.redisget(`tournament-${tournament_uuid}`);
        if (exist) {
          throw new Error("Tournament already created");
        }

        // check Team Matches Exists
        const teamRepo = AppDataSource.getRepository(Team);
        for (const m of matches) {
          if (!m.home_team_uuid || !m.away_team_uuid || !m.round)
            throw new Error("All fields are required!");
          if (!["BYE", "TBD"].includes(m.home_team_uuid)) {
            const homeTeam = await teamRepo.findOneBy({
              uuid: m.home_team_uuid,
              deletedBy: undefined,
            });
            if (!homeTeam) throw new Error("Team uuid not found!");
          }
          if (!["BYE", "TBD"].includes(m.away_team_uuid)) {
            const awayTeam = await teamRepo.findOneBy({
              uuid: m.away_team_uuid,
              deletedBy: undefined,
            });
            if (!awayTeam) throw new Error("Team uuid not found!");
          }
        }
        let round = 1;
        let seedIndex = 1;
        // save
        const newData = matches.map((m: any) => {
          if (Number(m.round) !== round) {
            round = Number(m.round);
            seedIndex = 1;
          }
          const newMatch = new Matches();
          newMatch.uuid = uuidv4();
          newMatch.tournament_uuid = tournament_uuid;
          newMatch.home_team_uuid = m.home_team_uuid;
          newMatch.away_team_uuid = m.away_team_uuid;
          newMatch.court_field_uuid = m.court_field_uuid;
          newMatch.status = m.status;
          newMatch.time = m.date ? new Date(m.date) : undefined;
          newMatch.round = round;;
          newMatch.seed_index = seedIndex;;
          newMatch.createdBy = req.data?.uuid || undefined;
          seedIndex++;
          return newMatch;
        });

        const data = await em.save(newData);
        if (data.length > 0) {
          redisLib.redisset(`tournament-${tournament_uuid}`, true);
        }
        utilLib.loggingRes(req, { data });
        return res.json({ data });
        
      });
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async updateMultiple(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { tournament_uuid, matches } = req.body;
    try {
      if (!tournament_uuid || !matches) {
        throw new Error("All fields are required!");
      }
      const tRepo = AppDataSource.getRepository(Tournament);
      const dataExists = await tRepo.findOneBy({
        uuid: tournament_uuid,
        deletedBy: IsNull(),
      });
      if (!dataExists) {
        throw new Error("Tournament not found!");
      }
      const result:{
        data: any[];
        updatedRecords: number;
        messages: string;
      } = {
        data: [],
        updatedRecords: 0,
        messages: "Sucess"
      }
      // transactional appdatasource create transaction
      await AppDataSource.transaction(async (em) => {
        // Get all existing matches for this tournament
        const existingMatches = await em.find(Matches, {
          where: {
            tournament_uuid: tournament_uuid,
            deletedBy: IsNull(),
          },
        });

        // Create Set of payload UUIDs for fast lookup
        const payloadUuids = new Set(matches.map((m: any) => m.uuid).filter(Boolean));

        // Soft delete matches that are not in payload
        let deletedCount = 0;
        for (const existingMatch of existingMatches) {
          if (!payloadUuids.has(existingMatch.uuid)) {
            existingMatch.deletedBy = req.data?.uuid || undefined;
            existingMatch.deletedAt = new Date();
            await em.save(existingMatch);
            deletedCount++;
          }
        }

        if (deletedCount > 0) {
          utilLib.loggingRes(req, { 
            message: `Soft deleted ${deletedCount} matches that are not in payload`
          });
        }
        
        let index = 1;
        for (const m of matches) {
          if (!m.uuid) {
            const newMatch = new Matches();
            newMatch.uuid = uuidv4();
            newMatch.tournament_uuid = tournament_uuid;
            newMatch.home_team_uuid = m.home_team_uuid;
            newMatch.away_team_uuid = m.away_team_uuid;
            newMatch.court_field_uuid = m.court_field_uuid;
            newMatch.status = m.status;
            newMatch.time = m.time ? new Date(m.time) : undefined;
            newMatch.round = m.round !== undefined ? m.round : null;
            newMatch.tournament_group_index = m.group;
            newMatch.seed_index = m.seed_index || null;
            newMatch.home_group_index = m.home_group_index;
            newMatch.home_group_position = m.home_group_position;
            newMatch.away_group_index = m.away_group_index;
            newMatch.away_group_position = m.away_group_position;
            newMatch.createdBy = req.data?.uuid || undefined;
            await em.save(newMatch);
            result.data.push(newMatch);
            result.updatedRecords++;
          } else {
            // Use em for consistency within transaction
            const dataExists = await em.findOne(Matches, {
              where: {
                uuid: m.uuid,
                deletedBy: IsNull(),
              },
            });
            if (dataExists) {

              dataExists.home_team_uuid = m.home_team_uuid;
              dataExists.away_team_uuid = m.away_team_uuid;
              dataExists.court_field_uuid = m.court_field_uuid;
              dataExists.status = m.status;
              dataExists.time = m.time ? new Date(m.time) : undefined;
            dataExists.round = m.round !== undefined ? m.round : null;
              dataExists.tournament_group_index = m.group;
              dataExists.home_group_index = m.home_group_index;
              dataExists.home_group_position = m.home_group_position;
              dataExists.away_group_index = m.away_group_index;
              dataExists.away_group_position = m.away_group_position;
              dataExists.seed_index = m.seed_index || null;
              await em.save(dataExists);
              result.data.push(dataExists);
              result.updatedRecords++;
            } else {

              const newMatch = new Matches();
              newMatch.uuid = uuidv4();
              newMatch.tournament_uuid = tournament_uuid;
              newMatch.home_team_uuid = m.home_team_uuid;
              newMatch.away_team_uuid = m.away_team_uuid;
              newMatch.court_field_uuid = m.court_field_uuid;
              newMatch.status = m.status;
              newMatch.time = m.time ? new Date(m.time) : undefined;
              newMatch.round = m.round !== undefined ? m.round : null;
              newMatch.tournament_group_index = m.group;
              newMatch.seed_index = m.seed_index || index;
              newMatch.home_group_index = m.home_group_index;
              newMatch.home_group_position = m.home_group_position;
              newMatch.away_group_index = m.away_group_index;
              newMatch.away_group_position = m.away_group_position;
              newMatch.seed_index = m.seed_index || null;
              newMatch.createdBy = req.data?.uuid || undefined;
              await em.save(newMatch);
              result.data.push(newMatch);
              result.updatedRecords++;
            }
          }
          index++
        }
        utilLib.loggingRes(req, result);
        return res.json(result);
      }); 
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async createMultipleCustom(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { matches } = req.body;
    try {
      if (!matches) {
        throw new Error("Matches are required!");
      }
      const matchesRepo = AppDataSource.getRepository(Matches);
      for (const m of matches) {
        if (!m.date || !m.court_field_uuid || !m.point_config_uuid || !m.home_team || !m.away_team) {
          return res.status(400).json({ message: "Date, Court Field, Point Config, Home Team, and Away Team are required!" });
        }
        const existingMatch = await matchesRepo.findOne({
          where: {
            time: m.date ? new Date(m.date) : undefined,
            court_field_uuid: m.court_field_uuid,
            deletedBy: IsNull(),
          },
          relations: {
            court_field: {
              court:true
            }
          }
        });
        if (existingMatch) {
          throw new Error(`Match already exists on ${existingMatch.court_field?.court?.name} - ${existingMatch.court_field?.name} at ${new Date(m.date)}!`);
        }
      }
      const result:{
        data: any[];
        updatedRecords: number;
        message: string;
      } = {
        data: [],
        updatedRecords: 0,
        message: "Sucess"
      }
      // transactional appdatasource create transaction
      await AppDataSource.transaction(async (em) => {
        // create teams from matches[index].home_team and matches[index].away_team
        const homeTeams: Team[] = [];
        const awayTeams: Team[] = [];
        const homeTeamPlayers: PlayerTeam[] = [];
        const awayTeamPlayers: PlayerTeam[] = [];
        const matchesToAdd: Matches[] = [];
        for (const m of matches) {
          const homeTeam = new Team();
          homeTeam.uuid = uuidv4();
          homeTeam.name = m.home_team.name;
          homeTeam.alias = m.home_team.alias;
          homeTeam.createdBy = req.data?.uuid || undefined;
          homeTeams.push(homeTeam);

          const awayTeam = new Team();
          awayTeam.uuid = uuidv4();
          awayTeam.name = m.away_team.name;
          awayTeam.alias = m.away_team.alias;
          awayTeam.createdBy = req.data?.uuid || undefined;
          awayTeams.push(awayTeam);

          for (const htp of m.home_team.players) {
            const homeTeamPlayer = new PlayerTeam();
            homeTeamPlayer.uuid = uuidv4();
            homeTeamPlayer.team_uuid = homeTeam.uuid;
            homeTeamPlayer.player_uuid = htp.uuid;
            homeTeamPlayer.createdBy = req.data?.uuid || undefined;
            homeTeamPlayers.push(homeTeamPlayer);
          }

          for (const atp of m.away_team.players) {
            const awayTeamPlayer = new PlayerTeam();
            awayTeamPlayer.uuid = uuidv4();
            awayTeamPlayer.team_uuid = awayTeam.uuid;
            awayTeamPlayer.player_uuid = atp.uuid;
            awayTeamPlayer.createdBy = req.data?.uuid || undefined;
            awayTeamPlayers.push(awayTeamPlayer);
          }

          const newMatch = new Matches();
          newMatch.uuid = uuidv4();
          newMatch.point_config_uuid = m.point_config_uuid;
          newMatch.home_team_uuid = homeTeam.uuid;
          newMatch.away_team_uuid = awayTeam.uuid;
          newMatch.court_field_uuid = m.court_field_uuid;
          newMatch.status = m.status;
          newMatch.time = m.date ? new Date(m.date) : undefined;
          newMatch.with_ad = m.with_ad;
          newMatch.round = 1;
          newMatch.seed_index = m.seed_index;
          newMatch.createdBy = req.data?.uuid || undefined;
          matchesToAdd.push(newMatch);
          result.data.push(newMatch);
          result.updatedRecords++;
        }
        await em.save(homeTeams);
        await em.save(awayTeams);
        await em.save(homeTeamPlayers);
        await em.save(awayTeamPlayers);
        await em.save(matchesToAdd);
        utilLib.loggingRes(req, result);
        return res.json(result);
      });
      
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async updateCustom(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid, home_team, away_team, home_team_uuid, away_team_uuid, point_config_uuid, date, court_field_uuid } = req.body;
    try {
      
      if (!uuid || !home_team || !away_team || !home_team_uuid || !away_team_uuid || !point_config_uuid) {
        return res.status(400).json({ message: "Match UUID, Home Team, Away Team, and Point Config are required!" });
      }
      const matchesRepo = AppDataSource.getRepository(Matches);
      await AppDataSource.transaction(async (em) => {
        const teamPLayersRepo = AppDataSource.getRepository(PlayerTeam);
        const homeTeamPlayers = await teamPLayersRepo.findBy({
            team_uuid: home_team_uuid,
            deletedAt: IsNull()
        });
        
        if (!homeTeamPlayers?.length) {
          throw new Error("Home Team Player not found!");
        } else {
          let i = 0;
          for (const hp of homeTeamPlayers) {
            hp.player_uuid = home_team.players[i].uuid;
            await em.save(hp);
            i++;
          }
        }
        const awayTeamPlayers = await teamPLayersRepo.findBy({
          team_uuid: away_team_uuid,
          deletedAt: IsNull()
        });
        
        if (!awayTeamPlayers?.length) {
          throw new Error("Away Team Player not found!");
        } else {
          let i = 0;
          for (const ap of awayTeamPlayers) {
            ap.player_uuid = away_team.players[i].uuid;
            await em.save(ap);
            i++;
          }
        }
        const dataExists = await matchesRepo.findOneBy({
          uuid: uuid,
          deletedBy: IsNull(),
        });
        if (!dataExists) {
          throw new Error("Match not found!");
        }
        dataExists.point_config_uuid = point_config_uuid || point_config_uuid;
        dataExists.time = date ? new Date(date) : dataExists.time;
        dataExists.court_field_uuid = court_field_uuid || dataExists.court_field_uuid;
        await em.save(dataExists);
        utilLib.loggingRes(req, {data:dataExists, message:"Match updated successfully!"});
        return res.json({data:dataExists, message:"Match updated successfully!"});
      });
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async delete(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    try {
      const matchesRepo = AppDataSource.getRepository(Matches);
      const data = await matchesRepo.findOneBy({ uuid, deletedAt: IsNull() });
      if (!data) {
        throw new Error("Match not found!");
      }
      data.deletedAt = new Date();
      data.deletedBy = req.data?.uuid || undefined;
      await matchesRepo.save(data);
      utilLib.loggingRes(req, { data, message: "Match deleted successfully!" });
      return res.json({ data, message: "Match deleted successfully!" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async updateVideoURL(req:any, res:any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { video_url } = req.body;
    try {
      if (!video_url) {
        throw new Error("Video URL is required!");
      }

      const matchesRepo = AppDataSource.getRepository(Matches);
      const data = await matchesRepo.findOneBy({ uuid, deletedAt: IsNull() });
      if (!data) {
        throw new Error("Match not found!");
      }
      data.youtube_url = video_url;
      await matchesRepo.save(data);

      utilLib.loggingRes(req, { data });
      return res.json({ data });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async updatePlayerTeamGroup(req:any, res:any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { groups } = req.body;
    const payload = updateGroupPayloadSchema.safeParse(req.body);
    if (!payload.success) {
      return res.status(400).json({ message: payload.error.message });
    }
    const tournament_uuid = uuid; // uuid from params is tournament_uuid
    try {
      if (!tournament_uuid || !groups) {
        throw new Error("Tournament UUID and groups are required!");
      }


      await AppDataSource.transaction(async (em) => {

        const groupRepo = em.getRepository(TournamentGroup);

        // Get all existing groups for this tournament
        const existingGroups = await groupRepo.find({
          where: {
            tournament_uuid: tournament_uuid,
            deletedAt: IsNull(),
          },
        });

        // Create Set of new group UUIDs for fast lookup
        const newGroupUuids = new Set(groups.map((g: any) => g.uuid));
        const teamRepoEM = em.getRepository(Team);
        // Delete groups that are not in the new groups list
        for (const existingGroup of existingGroups) {
          if (!newGroupUuids.has(existingGroup.group_uuid)) {
            existingGroup.deletedBy = req.data?.uuid || undefined;
            existingGroup.deletedAt = new Date();
            await em.save(TournamentGroup, existingGroup);

            // Also update teams that belong to this deleted group
            const teamsInGroup = await teamRepoEM.find({
              where: {
                group_uuid: existingGroup.group_uuid,
                deletedAt: IsNull(),
              },
            });
            for (const team of teamsInGroup) {
              team.deletedBy = req.data?.uuid || undefined;
              team.deletedAt = new Date();
              team.group_uuid = null;
              await em.save(Team, team);
            }
          }
        }

        // Process each group in the new list
        for (const group of groups) {
          const existingGroup = existingGroups.find(
            (g) => g.group_uuid === group.uuid && g.deletedAt === null
          );
          // EXISTING GROUP LOGIC START
          if (existingGroup) {
            // Update existing group
            existingGroup.group_name = group.name;
            await em.save(existingGroup);
            // update teams in existing group
            // get existing teams in group from db
            const existingGroupTeams = await teamRepoEM.find({
              where: {
                group_uuid: existingGroup.group_uuid,
                deletedAt: IsNull(),
              },
            });
            // if existing group teams in db is not in the new group teams, remove them from group
            for (const groupTeam of existingGroupTeams) {
              if (!group.teams.some((t: any) => t.uuid === groupTeam.uuid)) {
                groupTeam.group_uuid = null;
                await em.save(Team, groupTeam);
              }
            }
            // if new group teams is not in the existing group teams in db, add them to group
            for (let i = 0; i < group.teams.length; i++) {
              const team = group.teams[i];
              if (!existingGroupTeams.some((t) => t.uuid === team.uuid)) {
                const teamToUpdate = await teamRepoEM.findOneBy({ uuid: team.uuid });
                if (teamToUpdate) {
                  teamToUpdate.group_uuid = group.uuid;
                  // Use position from request if available, otherwise calculate based on index
                  teamToUpdate.position = team.position !== undefined ? team.position : i + 1;
                  await em.save(Team, teamToUpdate);
                }
              }
            }

          // EXISTING GROUP LOGIC END
          } else {
            // NEW GROUP LOGIC START
            // Create new group
            const newGroup = new TournamentGroup();
            newGroup.group_uuid = group.uuid || uuidv4();
            newGroup.tournament_uuid = tournament_uuid;
            newGroup.group_name = group.name;
            newGroup.createdBy = req.data?.uuid || undefined;
            newGroup.updatedAt = new Date();
            newGroup.createdAt = new Date();
            await em.save(newGroup);
            // add teams to new group
            for (let i = 0; i < group.teams.length; i++) {
              const team = group.teams[i];
              const teamToUpdate = await teamRepoEM.findOneBy({ uuid: team.uuid, tournament_uuid: tournament_uuid });
              if (teamToUpdate) {
                teamToUpdate.group_uuid = newGroup.group_uuid;
                  // Use position from request if available, otherwise calculate based on index
                  teamToUpdate.position = team.position !== undefined ? team.position : i + 1;
                await em.save(Team, teamToUpdate);
                console.log("\nteamToUpdate--------------------\n",teamToUpdate);
                
              }
            }
            // NEW GROUP LOGIC END
          }
        }
        
        // Handle matches for all groups
        await this.handleMatchesForGroups(em, tournament_uuid, payload.data.matches, req);
        // throw {message:`Match updated successfully!`};
        
        utilLib.loggingRes(req, { message: "Player team group updated successfully!" });
        return res.json({ message: "Player team group updated successfully!" });
      });
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async updateTeamGroupOnly(req:any, res:any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const { groups } = req.body;
    const payload = updateTeamGroupOnlyPayloadSchema.safeParse(req.body);
    if (!payload.success) {
      return res.status(400).json({ message: payload.error.message });
    }
    const tournament_uuid = uuid; // uuid from params is tournament_uuid
    try {
      if (!tournament_uuid || !groups) {
        throw new Error("Tournament UUID and groups are required!");
      }


      await AppDataSource.transaction(async (em) => {

        const groupRepo = em.getRepository(TournamentGroup);

        // Get all existing groups for this tournament
        const existingGroups = await groupRepo.find({
          where: {
            tournament_uuid: tournament_uuid,
            deletedAt: IsNull(),
          },
        });

        // Create Set of new group UUIDs for fast lookup
        const newGroupUuids = new Set(groups.map((g: any) => g.uuid));
        const teamRepoEM = em.getRepository(Team);
        // Delete groups that are not in the new groups list
        for (const existingGroup of existingGroups) {
          if (!newGroupUuids.has(existingGroup.group_uuid)) {
            existingGroup.deletedBy = req.data?.uuid || undefined;
            existingGroup.deletedAt = new Date();
            await em.save(TournamentGroup, existingGroup);

            // Also update teams that belong to this deleted group
            const teamsInGroup = await teamRepoEM.find({
              where: {
                group_uuid: existingGroup.group_uuid,
                deletedAt: IsNull(),
              },
            });
            for (const team of teamsInGroup) {
              team.group_uuid = null;
              await em.save(Team, team);
            }
          }
        }

        // Process each group in the new list
        for (const group of groups) {
          const existingGroup = existingGroups.find(
            (g) => g.group_uuid === group.uuid && g.deletedAt === null
          );
          // EXISTING GROUP LOGIC START
          if (existingGroup) {
            // Update existing group
            existingGroup.group_name = group.name;
            await em.save(existingGroup);
            // update teams in existing group
            // get existing teams in group from db
            const existingGroupTeams = await teamRepoEM.find({
              where: {
                group_uuid: existingGroup.group_uuid,
                deletedAt: IsNull(),
              },
            });
            // if existing group teams in db is not in the new group teams, remove them from group
            for (const groupTeam of existingGroupTeams) {
              if (!group.teams.some((t: any) => t.uuid === groupTeam.uuid)) {
                groupTeam.group_uuid = null;
                await em.save(Team, groupTeam);
              }
            }
            // if new group teams is not in the existing group teams in db, add them to group
            for (let i = 0; i < group.teams.length; i++) {
              const team = group.teams[i];
              if (!existingGroupTeams.some((t) => t.uuid === team.uuid)) {
                const teamToUpdate = await teamRepoEM.findOneBy({ uuid: team.uuid });
                if (teamToUpdate) {
                  teamToUpdate.group_uuid = group.uuid;
                  // Use position from request if available, otherwise calculate based on index
                  teamToUpdate.position = team.position !== undefined ? team.position : i + 1;
                  await em.save(Team, teamToUpdate);
                }
              }
            }

          // EXISTING GROUP LOGIC END
          } else {
            // NEW GROUP LOGIC START
            // Create new group
            const newGroup = new TournamentGroup();
            newGroup.group_uuid = group.uuid || uuidv4();
            newGroup.tournament_uuid = tournament_uuid;
            newGroup.group_name = group.name;
            newGroup.createdBy = req.data?.uuid || undefined;
            newGroup.updatedAt = new Date();
            newGroup.createdAt = new Date();
            await em.save(newGroup);
            // add teams to new group
            for (let i = 0; i < group.teams.length; i++) {
              const team = group.teams[i];
              const teamToUpdate = await teamRepoEM.findOneBy({ uuid: team.uuid, tournament_uuid: tournament_uuid });
              if (teamToUpdate) {
                teamToUpdate.group_uuid = newGroup.group_uuid;
                  // Use position from request if available, otherwise calculate based on index
                  teamToUpdate.position = team.position !== undefined ? team.position : i + 1;
                await em.save(Team, teamToUpdate);
                
              }
            }
            // NEW GROUP LOGIC END
          }
        }
        
        utilLib.loggingRes(req, { message: "Team group updated successfully!" });
        return res.json({ message: "Team group updated successfully!" });
      });
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  private async handleMatchesForGroups(
    em: EntityManager,
    tournament_uuid: string,
    matches: UpdateGroupPayloadData['matches'],
    req: any
  ): Promise<void> {
    const matchesRepo = em.getRepository(Matches);
    const groupRepo = em.getRepository(TournamentGroup);
    const groups = await groupRepo.findBy({
      tournament_uuid: tournament_uuid,
      deletedAt: IsNull(),
    })
    // Get all existing matches for this tournament
    const existingMatches = await matchesRepo.find({
      where: {
        tournament_uuid: tournament_uuid,
        round: -1,
        group_uuid: In(groups.map((group) => group.group_uuid)),
        deletedAt: IsNull(),
      },
    });

    // Collect all match UUIDs from the payload
    const newMatchUuids = new Set(
      matches?.map((match) => match.uuid) || []
    );

    // Delete matches that are not in the new matches list
    for (const existingMatch of existingMatches) {
      if (!newMatchUuids.has(existingMatch.uuid)) {
        existingMatch.deletedBy = req.data?.uuid || undefined;
        existingMatch.deletedAt = new Date();
        await em.save(existingMatch);
      }
    }

    // Add or update matches
    if (matches && matches.length > 0) {
      for (const match of matches) {
          const existingMatch = existingMatches.find((m: Matches) => m.uuid === match.uuid);
          const group_uuid = groups.find((g: TournamentGroup) => g.group_uuid === match.group_uuid || g.group_name === String.fromCharCode(65 + match.groupKey) )?.group_uuid || null;
          if (existingMatch) {
            // Update existing match
            existingMatch.home_team_uuid = match.home_team_uuid;
            existingMatch.away_team_uuid = match.away_team_uuid;
            existingMatch.court_field_uuid = match.court_field_uuid;
            existingMatch.status = match.status as any || 'UPCOMING';
            existingMatch.time = match.time ? new Date(match.time) : new Date();
            existingMatch.round = -1;
            existingMatch.group_uuid = group_uuid; // Associate with group
            existingMatch.tournament_group_index = match.groupKey || undefined;
            existingMatch.seed_index = -1;
            await em.save(existingMatch);
          } else {
            // Create new match
            const newMatch = new Matches();
            newMatch.uuid = match.uuid || uuidv4();
            newMatch.tournament_uuid = tournament_uuid;
            newMatch.home_team_uuid = match.home_team_uuid;
            newMatch.away_team_uuid = match.away_team_uuid;
            newMatch.court_field_uuid = match.court_field_uuid;
            newMatch.status = match.status as MatchStatus ||  MatchStatus.UPCOMING;
            newMatch.time =  match.time ? new Date(match.time) : new Date();
            newMatch.round = -1;
            newMatch.group_uuid = group_uuid; // Associate with group
            newMatch.tournament_group_index = match.groupKey || undefined;
            newMatch.seed_index = -1;
            newMatch.createdBy = req.data?.uuid || undefined;
            await em.save(newMatch);
          }
        }
    }
  }

  async updateMultipleGroupMatches(req:any, res:any) {
    const utilLib = Util.getInstance();
    const { tournament_uuid, matches } = req.body;
    const payload = updateMultipleMatchesPayloadSchema.safeParse(req.body);
    if (!payload.success) {
      return res.status(400).json({ message: payload.error.message });
    }
    try {
      if (!tournament_uuid || !matches) {
        throw new Error("Tournament UUID and matches are required!");
      }
      
      // Transform matches from UpdateMatchPayload to UpdateGroupPayloadData['matches'] format
      const transformedMatches = matches.map((match: UpdateMatchPayload) => ({
        uuid: match.uuid,
        home_team_uuid: match.home_team_uuid,
        away_team_uuid: match.away_team_uuid,
        court_field_uuid: match.court_field_uuid || '',
        time: match.time || '',
        group_uuid: match.group_uuid || null, // Will be determined by handleMatchesForGroups
        status: match.status || 'UPCOMING',
        groupKey: match.group || 0, // Map group to groupKey
      }));
      
      await AppDataSource.transaction(async (em) => {
        await this.handleMatchesForGroups(em, tournament_uuid, transformedMatches, req);
      });
      
      return res.status(200).json({ message: "Match updated successfully!" });
    } catch (error) {
      console.error("Error updating match:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateMultipleKnockoutMatches(req:any, res:any) {
    const utilLib = Util.getInstance();
    const { tournament_uuid, matches } = req.body;
    const payload = updateMultipleMatchesPayloadSchema.safeParse(req.body);
    if (!payload.success) {
      return res.status(400).json({ message: payload.error.message });
    }
    try {
      if (!tournament_uuid || !matches) {
        throw new Error("Tournament UUID and matches are required!");
      }
      
      // Validate that all matches are knockout matches
      for (const match of matches) {
        if (match.group_uuid && match.group_uuid !== '') {
          throw new Error("Knockout matches cannot have group_uuid!");
        }
        if (match.round === undefined || match.round < 0) {
          throw new Error("Knockout matches must have round >= 0!");
        }
        if (match.seed_index === undefined || match.seed_index < 0) {
          throw new Error("Knockout matches must have seed_index >= 0!");
        }
      }
      
      const matchesRepo = AppDataSource.getRepository(Matches);
      const existingKnockoutMatches = await matchesRepo.find({
        where: {
          tournament_uuid: tournament_uuid,
          group_uuid: IsNull(), // Only knockout matches
          seed_index: MoreThanOrEqual(0),
          round: MoreThanOrEqual(0),
          deletedAt: IsNull(),
        },
      });
      
      await AppDataSource.transaction(async (em) => {
        // soft delete existing knockout matches
        for (const existingMatch of existingKnockoutMatches) {
          existingMatch.deletedBy = req.data?.uuid || undefined;
          existingMatch.deletedAt = new Date();
          await em.save(existingMatch);
        }
        
        // add new knockout matches
        const newMatches = matches.map((match: UpdateMatchPayload) => {
          const newMatch = new Matches();
          newMatch.uuid = match.uuid || uuidv4();
          newMatch.tournament_uuid = tournament_uuid;
          newMatch.home_team_uuid = match.home_team_uuid;
          newMatch.away_team_uuid = match.away_team_uuid;
          newMatch.court_field_uuid = match.court_field_uuid || null;
          newMatch.status = (match.status as MatchStatus) || MatchStatus.UPCOMING;
          newMatch.time = match.time ? new Date(match.time) : undefined;
          newMatch.round = match.round || 0;
          newMatch.tournament_group_index = undefined; // No group for knockout
          newMatch.home_group_index = match.home_group_index || undefined;
          newMatch.home_group_position = match.home_group_position || undefined;
          newMatch.home_group_uuid = match.home_group_uuid || undefined;
          newMatch.away_group_index = match.away_group_index || undefined;
          newMatch.away_group_position = match.away_group_position || undefined;
          newMatch.away_group_uuid = match.away_group_uuid || undefined;
          newMatch.seed_index = match.seed_index || 0;
          newMatch.group_uuid = null; // Ensure no group for knockout matches
          newMatch.createdBy = req.data?.uuid || undefined;
          return newMatch;
        });
        
        await em.save(newMatches);
      });
      
      utilLib.loggingRes(req, { message: "Knockout matches updated successfully" });
      return res.status(200).json({ message: "Knockout matches updated successfully!" });
    } catch (error: any) {
      console.error("Error updating knockout matches:", error);
      utilLib.loggingError(req, error.message);
      return res.status(500).json({ message: error.message });
    }
  }

  async updateMultipleMatches(req:any, res:any) {
    const utilLib = Util.getInstance();
    // const { uuid } = req.params;
    const { tournament_uuid, matches } = req.body;
    const payload = updateMultipleMatchesPayloadSchema.safeParse(req.body);
    if (!payload.success) {
      return res.status(400).json({ message: payload.error.message });
    }
    try {
      if (!tournament_uuid || !matches) {
        throw new Error("Tournament UUID and matches are required!");
      }
      const matchesRepo = AppDataSource.getRepository(Matches);
      const existingMatches = await matchesRepo.find({
        where: {
          tournament_uuid: tournament_uuid,
          deletedAt: IsNull(),
        },
      });
      await AppDataSource.transaction(async (em) => {
        // soft delete existing matches
        for (const existingMatch of existingMatches) {
          existingMatch.deletedBy = req.data?.uuid || undefined;
          existingMatch.deletedAt = new Date();
          await em.save(existingMatch);
        }
        // add new matches
        const newMatches = matches.map((match: UpdateMatchPayload) => {
          const newMatch = new Matches();
          newMatch.uuid = uuidv4();
          newMatch.tournament_uuid = tournament_uuid;
          newMatch.home_team_uuid = match.home_team_uuid;
          newMatch.away_team_uuid = match.away_team_uuid;
          newMatch.court_field_uuid = match.court_field_uuid || null;
          newMatch.status = (match.status as MatchStatus) || MatchStatus.UPCOMING;
          newMatch.time = match.time ? new Date(match.time) : undefined;
          newMatch.round = match.round || 0;
          newMatch.tournament_group_index = match.group || undefined;
          newMatch.home_group_index = match.home_group_index || undefined;
          newMatch.home_group_position = match.home_group_position || undefined;
          newMatch.away_group_index = match.away_group_index || undefined;
          newMatch.away_group_position = match.away_group_position || undefined;
          newMatch.seed_index = match.seed_index || 0;
          newMatch.createdBy = req.data?.uuid || undefined;
          return newMatch;
        });
          await em.save(newMatches);
      }).catch((error) => {
        utilLib.loggingError(req, error.message);
        return res.status(400).json({ message: error.message });
      }).then(d => {
        utilLib.loggingRes(req, { message: "Match updated successfully" });
        return res.status(200).json({ message: "Match updated successfully" });
      });
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async updateMatch(req:any, res:any) {
    const utilLib = Util.getInstance();
    const { uuid } = req.params;
    const match = req.body;
    try {
      if (!uuid || !match) {
        throw new Error("Match UUID and match are required!");
      }
      const payload = updateMatchPayloadSchema.safeParse(req.body);
      if (!payload.success) {
        return res.status(400).json({ message: payload.error.message });
      }
      await AppDataSource.transaction(async (em) => {
        const matchesRepo = em.getRepository(Matches);
        const existingMatch = await matchesRepo.findOneBy({ uuid, deletedAt: IsNull() });
        if (!existingMatch) {
          return res.status(400).json({ message: "Match not found!" });
        }
        existingMatch.home_team_uuid = match.home_team_uuid || existingMatch.home_team_uuid;
        existingMatch.away_team_uuid = match.away_team_uuid || existingMatch.away_team_uuid;
        existingMatch.court_field_uuid = match.court_field_uuid || existingMatch.court_field_uuid;
        existingMatch.status = match.status || existingMatch.status;
        existingMatch.time = match.time ? new Date(match.time) : existingMatch.time;
        existingMatch.round = match.round || existingMatch.round;
        existingMatch.tournament_group_index = match.group || existingMatch.tournament_group_index;
        existingMatch.home_group_index = match.home_group_index || existingMatch.home_group_index;
        existingMatch.home_group_position = match.home_group_position || existingMatch.home_group_position;
        existingMatch.away_group_index = match.away_group_index || existingMatch.away_group_index;
        existingMatch.away_group_position = match.away_group_position || existingMatch.away_group_position;
        existingMatch.seed_index = match.seed_index || existingMatch.seed_index;
        existingMatch.updatedAt = new Date();
        await em.save(existingMatch);
        utilLib.loggingRes(req, { data: existingMatch, message: "Match updated successfully!" });
        return res.json({ data: existingMatch, message: "Match updated successfully!" });
      });
    } catch (error: any) {
      console.log(error);
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }

}


