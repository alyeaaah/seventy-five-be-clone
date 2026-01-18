import Util from "../lib/util.lib";
import { v4 as uuidv4 } from "uuid";
import { MoreThan, IsNull, In } from "typeorm";
import { AppDataSource } from "../data-source";
import { Challenger, ChallengerStatus } from "../entities/Challenger";
import { Player } from "../entities/Player";
import { Team } from "../entities/Team";
import { CourtFields } from "../entities/CourtFields";
import { PointConfig } from "../entities/PointConfig";
import { Matches, MatchStatus } from "../entities/Matches";
import { PlayerTeam } from "../entities/PlayerTeam";

export default class ChallengerController {
  async listOpenChallengers(req: any, res: any) {
    const utilLib = Util.getInstance();
    const { player_uuid } = req.query;

    try {
      const challengerRepo = AppDataSource.getRepository(Challenger);
      
      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const queryBuilder = challengerRepo
        .createQueryBuilder("challenger")
        .leftJoinAndSelect("challenger.challengerA", "challengerA")
        .leftJoinAndSelect("challenger.challengerB", "challengerB")
        .leftJoinAndSelect("challenger.opponentA", "opponentA")
        .leftJoinAndSelect("challenger.opponentB", "opponentB")
        .leftJoinAndSelect("challenger.court_field", "court_field")
        .leftJoinAndSelect("court_field.court", "court")
        .leftJoinAndSelect("challenger.point_config", "point_config")
        .where("challenger.status = :status", { status: ChallengerStatus.OPEN })
        .andWhere("challenger.createdAt >= :date", { date: thirtyDaysAgo })
        .andWhere("challenger.deletedAt IS NULL")
        .andWhere("challenger.deletedBy IS NULL");

      // Add player filtering if provided - but show complete teams
      let filteredChallengerIds: number[] = [];
      if (player_uuid) {
        const filteredChallengers = await queryBuilder
          .clone()
          .andWhere(
            "(challengerA.uuid = :player_uuid OR challengerB.uuid = :player_uuid OR opponentA.uuid = :player_uuid OR opponentB.uuid = :player_uuid)",
            { player_uuid }
          )
          .select("challenger.id")
          .getRawMany();
        
        filteredChallengerIds = filteredChallengers.map(c => c.challenger_id).filter(id => id !== undefined) as number[];
      }

      const challengers = await queryBuilder
        .orderBy("challenger.createdAt", "DESC")
        .getMany();
      
      // Filter by challenger IDs if player_uuid was provided
      const finalChallengers = player_uuid 
        ? challengers.filter(c => c.id !== undefined && filteredChallengerIds.includes(c.id))
        : challengers;
      
      // Debug: Check player data directly
      for (let i = 0; i < finalChallengers.length; i++) {
        const challenge = finalChallengers[i];
        console.log("Challenge players:", {
          challengerA: challenge.challengerA,
          challengerB: challenge.challengerB,
          opponentA: challenge.opponentA,
          opponentB: challenge.opponentB
        });
      }
      
      const responses = finalChallengers.map((challenge) => {
        return {
          id: challenge.id,
          time: challenge.time,
          status: challenge.status,
          createdBy: challenge.createdBy,
          createdAt: challenge.createdAt,
          court: {
            uuid: challenge.court_field?.court?.uuid || challenge.court_field?.court_uuid,
            name: `${challenge.court_field?.court?.name} - ${challenge.court_field?.name}`,
            court_field_uuid: challenge.court_field?.uuid,
          },
          challengerA: challenge.challengerA ? {
            uuid: challenge.challengerA?.uuid,
            name: challenge.challengerA?.name,
            image_url: challenge.challengerA?.media_url,
          } : undefined,
          challengerB: challenge.challengerB ? {
            uuid: challenge.challengerB?.uuid,
            name: challenge.challengerB?.name,
            image_url: challenge.challengerB?.media_url,
          } : undefined,
          opponentA: challenge.opponentA ? {
            uuid: challenge.opponentA?.uuid,
            name: challenge.opponentA?.name,
            image_url: challenge.opponentA?.media_url,
          } : undefined,
          opponentB: challenge.opponentB ? {
            uuid: challenge.opponentB?.uuid,
            name: challenge.opponentB?.name,
            image_url: challenge.opponentB?.media_url,
          } : undefined
        };
      })
      utilLib.loggingRes(req, { responses });


      return res.status(200).json({
        status: "success",
        data: responses,
      });
    } catch (error: any) {
      console.error("Error listing open challengers:", error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Internal server error",
      });
    }
  }

  async openChallenge(req: any, res: any) {
    // body:
    // {
    //   "court_field_uuid": "string (required) - UUID of the court field",
    //   "time": "string (required) - ISO datetime string for the challenge time",
    //   "point_config_uuid": "string (optional) - UUID of the point configuration",
    //   "with_ad": "boolean (required) - Whether to use AD scoring",
    //   "challengerA_uuid": "string (required) - UUID of first challenger player",
    //   "challengerB_uuid": "string (required) - UUID of second challenger player",
    //   "opponentA_uuid": "string (optional) - UUID of first opponent player",
    //   "opponentB_uuid": "string (optional) - UUID of second opponent player"
    // }
    const utilLib = Util.getInstance();
    const { 
      court_field_uuid, 
      time, 
      point_config_uuid, 
      with_ad, 
      challengerA_uuid, 
      challengerB_uuid,
      opponentA_uuid,
      opponentB_uuid
    } = req.body;

    try {
      let savedChallengerId: number | undefined;
      
      // Start transaction
      await AppDataSource.transaction(async (entityManager) => {
        // Validate required fields
        if (!court_field_uuid || !time || !with_ad === undefined || !challengerA_uuid || !challengerB_uuid) {
          throw new Error("Required fields: court_field_uuid, time, with_ad, challengerA_uuid, challengerB_uuid");
        }

        const challengerRepo = entityManager.getRepository(Challenger);
        const playerRepo = entityManager.getRepository(Player);
        const courtFieldRepo = entityManager.getRepository(CourtFields);

        // Verify court field exists
        const courtField = await courtFieldRepo.findOneBy({ 
          uuid: court_field_uuid,
          deletedAt: IsNull()
        });
        if (!courtField) {
          throw new Error("Court field not found!");
        }

        // Verify all players exist in a single query
        const allPlayerUuids = [challengerA_uuid, challengerB_uuid];
        if (opponentA_uuid) allPlayerUuids.push(opponentA_uuid);
        if (opponentB_uuid) allPlayerUuids.push(opponentB_uuid);
        
        const foundPlayers = await playerRepo.find({
          where: { 
            uuid: In(allPlayerUuids),
            deletedAt: IsNull()
          }
        });
        
        if (foundPlayers.length < allPlayerUuids.length) {
          const missingUuids = allPlayerUuids.filter(uuid => 
            !foundPlayers.some(player => player.uuid === uuid)
          );
          throw new Error(`Players not found: ${missingUuids.join(', ')}`);
        }
        
        // Extract individual players
        const challengerA = foundPlayers.find(p => p.uuid === challengerA_uuid);
        const challengerB = foundPlayers.find(p => p.uuid === challengerB_uuid);
        const opponentA = opponentA_uuid ? foundPlayers.find(p => p.uuid === opponentA_uuid) : null;
        const opponentB = opponentB_uuid ? foundPlayers.find(p => p.uuid === opponentB_uuid) : null;
        
        if (!challengerA || !challengerB) {
          throw new Error("Required challenger players not found!");
        }

        // Create challenger with player UUIDs (no teams created at this stage)
        const newChallenger = new Challenger();
        newChallenger.challengerA_uuid = challengerA_uuid;
        newChallenger.challengerB_uuid = challengerB_uuid;
        if (opponentA) newChallenger.opponentA_uuid = opponentA_uuid || null;
        if (opponentB) newChallenger.opponentB_uuid = opponentB_uuid || null;
        newChallenger.court_field_uuid = court_field_uuid;
        newChallenger.point_config_uuid = point_config_uuid || null;
        newChallenger.with_ad = with_ad;
        newChallenger.time = new Date(time);
        newChallenger.status = ChallengerStatus.OPEN;
        newChallenger.createdBy = req.data?.uuid || "system";

        const savedChallenger = await challengerRepo.save(newChallenger);
        savedChallengerId = savedChallenger.id;
      });

      if (!savedChallengerId) {
        throw new Error("Failed to save challenger");
      }

      // Fetch the complete challenger with relations (outside transaction for read-only operation)
      const completeChallenger = await AppDataSource.getRepository(Challenger)
        .createQueryBuilder("challenger")
        .leftJoinAndSelect("challenger.challengerA", "challengerA")
        .leftJoinAndSelect("challenger.challengerB", "challengerB")
        .leftJoinAndSelect("challenger.opponentA", "opponentA")
        .leftJoinAndSelect("challenger.opponentB", "opponentB")
        .leftJoinAndSelect("challenger.court_field", "court_field")
        .leftJoinAndSelect("challenger.point_config", "point_config")
        .where("challenger.id = :id", { id: savedChallengerId })
        .getOne();

      return res.status(201).json({
        status: "success",
        data: completeChallenger,
        message: "Challenge created successfully!",
      });
    } catch (error: any) {
      console.error("Error creating challenge:", error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Internal server error",
      });
    }
  }

  async acceptChallenger(req: any, res: any) {
    // body:
    // {
    //   "challenger_id": "number (required) - ID of the challenger to accept",
    //   "court_field_uuid": "string (optional) - UUID of the court field if updated",
    //   "point_config_uuid": "string (optional) - UUID of the point config if updated",
    //   "time": "string (optional) - ISO datetime string for the challenge time if updated",
    //   "notes": "string (optional) - Notes for the challenge if updated",
    //   "opponentA_uuid": "string (required) - UUID of first opponent player",
    //   "opponentB_uuid": "string (required) - UUID of second opponent player"
    // }
    const { challenger_id, opponentA_uuid, opponentB_uuid } = req.body;

    try {
      let challengerId: number | undefined;
      let matchData: any;
      
      // Start transaction
      await AppDataSource.transaction(async (entityManager) => {
        // Validate required fields
        if (!challenger_id || !opponentA_uuid || !opponentB_uuid) {
          throw new Error("challenger_id, opponentA_uuid, and opponentB_uuid are required");
        }

        const challengerRepo = entityManager.getRepository(Challenger);
        const playerRepo = entityManager.getRepository(Player);
        const teamRepo = entityManager.getRepository(Team);
        const matchesRepo = entityManager.getRepository(Matches);
        const courtFieldRepo = entityManager.getRepository(CourtFields);
        const pointConfigRepo = entityManager.getRepository(PointConfig);

        // Get default point config if not provided

      // Find the challenger with player relations
      const challenger = await challengerRepo.findOne({
        where: { id: challenger_id, deletedAt: IsNull() },
        relations: ["challengerA", "challengerB"]
      });

      if (!challenger) {
        throw new Error("Challenger not found!");
      }

      if (challenger.status !== ChallengerStatus.OPEN) {
        throw new Error("Challenger is not in OPEN status!");
      }

      // Verify challenger players exist
      if (!challenger.challengerA || !challenger.challengerB) {
        throw new Error("Challenger players not found!");
      }
        
      let finalPointConfigUuid = challenger.point_config_uuid;
        if (!finalPointConfigUuid) {
          const defaultConfig = await pointConfigRepo.findOneBy({
            isDefault: true,
            deletedAt: IsNull()
          });
          if (defaultConfig) {
            finalPointConfigUuid = defaultConfig.uuid || finalPointConfigUuid;
          }
        }
      // Verify opponent players exist
      const opponentA = await playerRepo.findOneBy({ 
        uuid: opponentA_uuid,
        deletedAt: IsNull()
      });
      if (!opponentA) {
        throw new Error(`Opponent A with UUID ${opponentA_uuid} not found!`);
      }

      const opponentB = await playerRepo.findOneBy({ 
        uuid: opponentB_uuid,
        deletedAt: IsNull()
      });
      if (!opponentB) {
        throw new Error(`Opponent B with UUID ${opponentB_uuid} not found!`);
      }

      // Create home team from challenger players
      const homeTeamName = `Challenge Team A - ${challenger.challengerA.name.substring(0, 3).padStart(3, "0").toUpperCase()}${challenger.challengerB.name.substring(0, 3).padStart(3, "0").toUpperCase()}`;
      const homeTeam = new Team();
      homeTeam.uuid = uuidv4();
      homeTeam.name = homeTeamName;
      homeTeam.createdBy = req.data?.uuid || "system";
      const savedHomeTeam = await teamRepo.save(homeTeam);
      
      // Add challenger players to home team
      const playerTeamRepo = entityManager.getRepository(PlayerTeam);
      for (const player of [challenger.challengerA, challenger.challengerB]) {
        const playerTeam = new PlayerTeam();
        playerTeam.uuid = uuidv4();
        playerTeam.player_uuid = player.uuid;
        playerTeam.team_uuid = savedHomeTeam.uuid;
        playerTeam.tournament_uuid = "";
        playerTeam.createdBy = req.data?.uuid || "system";
        await playerTeamRepo.save(playerTeam);
      }

      // Create away team from opponent players
      const awayTeamName = `Challenge Team B - ${opponentA.name.substring(0, 3).padStart(3, "0").toUpperCase()}${opponentB.name.substring(0, 3).padStart(3, "0").toUpperCase()}`;
      const awayTeam = new Team();
      awayTeam.uuid = uuidv4();
      awayTeam.name = awayTeamName;
      awayTeam.createdBy = req.data?.uuid || "system";
      const savedAwayTeam = await teamRepo.save(awayTeam);
      
      // Add opponent players to away team
      for (const player of [opponentA, opponentB]) {
        const playerTeam = new PlayerTeam();
        playerTeam.uuid = uuidv4();
        playerTeam.player_uuid = player.uuid;
        playerTeam.team_uuid = savedAwayTeam.uuid;
        playerTeam.tournament_uuid = "";
        playerTeam.createdBy = req.data?.uuid || "system";
        await playerTeamRepo.save(playerTeam);
      }

      // Update challenger with opponent players and status
      challenger.opponentA_uuid = opponentA_uuid;
      challenger.opponentB_uuid = opponentB_uuid;
      challenger.status = ChallengerStatus.ACCEPTED;
      await challengerRepo.save(challenger);

      // Create match record
      const newMatch = new Matches();
      newMatch.uuid = uuidv4();
      newMatch.home_team_uuid = savedHomeTeam.uuid;
      newMatch.away_team_uuid = savedAwayTeam.uuid;
      newMatch.winner_team_uuid = "";
      newMatch.home_team_score = 0;
      newMatch.away_team_score = 0;
      newMatch.round = 1;
      newMatch.seed_index = 0;
      newMatch.with_ad = challenger.with_ad;
      newMatch.youtube_url = "";
      newMatch.category = "CHALLENGE";
      newMatch.court_field_uuid = challenger.court_field_uuid;
      newMatch.point_config_uuid = finalPointConfigUuid;
      newMatch.time = challenger.time;
      newMatch.notes = challenger.notes;
      newMatch.status = MatchStatus.UPCOMING;
      newMatch.createdBy = req.data?.uuid || "system";

        const savedMatch = await matchesRepo.save(newMatch);
        
        challengerId = challenger.id;
        matchData = {
          id: savedMatch.id,
          uuid: savedMatch.uuid,
          home_team_uuid: savedMatch.home_team_uuid,
          away_team_uuid: savedMatch.away_team_uuid,
          status: savedMatch.status,
          time: savedMatch.time,
          court_field_uuid: savedMatch.court_field_uuid
        };
      });

      if (!challengerId) {
        throw new Error("Failed to process challenger");
      }

      // Fetch complete data with relations (outside transaction for read-only operation)
      const updatedChallenger = await AppDataSource.getRepository(Challenger)
        .createQueryBuilder("challenger")
        .leftJoinAndSelect("challenger.challengerA", "challengerA")
        .leftJoinAndSelect("challenger.challengerB", "challengerB")
        .leftJoinAndSelect("challenger.opponentA", "opponentA")
        .leftJoinAndSelect("challenger.opponentB", "opponentB")
        .leftJoinAndSelect("challenger.court_field", "court_field")
        .leftJoinAndSelect("challenger.point_config", "point_config")
        .where("challenger.id = :id", { id: challengerId })
        .getOne();

      return res.status(200).json({
        status: "success",
        data: {
          challenger: updatedChallenger,
          match: matchData
        },
        message: "Challenge accepted successfully!",
      });
    } catch (error: any) {
      console.error("Error accepting challenge:", error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Internal server error",
      });
    }
  }
}

