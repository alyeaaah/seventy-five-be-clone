import { MatchStatus, Matches } from "../entities/Matches";
import { MatchReferee } from "../entities/MatchReferee";
import { MatchRefereeStatus } from "../entities/MatchReferee";
import { Player } from "../entities/Player";
import { MatchAdministratorService } from "../services/match-administrator.service";
import { MatchScoreService } from "../services/match-score.service";
import { MatchService } from "../services/match.service";
import { AppDataSource } from "../data-source";
import { IsNull } from "typeorm";

export default class MatchController {
  private readonly matchAdministratorService: MatchAdministratorService;
  private readonly matchScoreService: MatchScoreService;
  private readonly matchService: MatchService;
  private readonly matchRefereeRepository = AppDataSource.getRepository(MatchReferee);
  private readonly playerRepository = AppDataSource.getRepository(Player);
  private readonly matchRepository = AppDataSource.getRepository(Matches);

  constructor() {
    this.matchAdministratorService = new MatchAdministratorService();
    this.matchScoreService = new MatchScoreService();
    this.matchService = new MatchService();
    
    // Bind all methods to preserve 'this' context when used as route handlers
    this.create = this.create.bind(this);
    this.createMultiple = this.createMultiple.bind(this);
    this.updateMultiple = this.updateMultiple.bind(this);
    this.createMultipleCustom = this.createMultipleCustom.bind(this);
    this.addReferee = this.addReferee.bind(this);
    this.fetchReferees = this.fetchReferees.bind(this);
    this.updateCustom = this.updateCustom.bind(this);
    this.list = this.list.bind(this);
    this.detail = this.detail.bind(this);
    this.updateScore = this.updateScore.bind(this);
    this.updateNextRound = this.updateNextRound.bind(this);
    this.updateVideoURL = this.updateVideoURL.bind(this);
    this.endMatch = this.endMatch.bind(this);
    this.updateMatchStatus = this.updateMatchStatus.bind(this);
    this.updateMatch = this.updateMatch.bind(this);
    this.updateTournamentGroup = this.updateTournamentGroup.bind(this);
    this.updateMultipleMatches = this.updateMultipleMatches.bind(this);
    this.updateTeamGroupOnly = this.updateTeamGroupOnly.bind(this);
    this.updateSetScore = this.updateSetScore.bind(this);
    this.endSet = this.endSet.bind(this);
    this.delete = this.delete.bind(this);
    this.getMatchesByPlayerUUID = this.getMatchesByPlayerUUID.bind(this);
    this.playerMatches = this.playerMatches.bind(this);
    this.publicMatchList = this.publicMatchList.bind(this);
    this.publicMatchDetail = this.publicMatchDetail.bind(this);
    this.publicTournamentMatchList = this.publicTournamentMatchList.bind(this);
    this.publicTournamentGroup = this.publicTournamentGroup.bind(this);
  }
  async create(req: any, res: any) {
    return this.matchAdministratorService.create(req, res);
  }
  async createMultiple(req: any, res: any) {
    return this.matchAdministratorService.createMultiple(req, res);
  }
  async updateMultiple(req: any, res: any) {
    return this.matchAdministratorService.updateMultiple(req, res);
  }
  async updateMultipleMatches(req: any, res: any) {
    const { mode } = req.query;
    switch (mode) {
      case "group":
        return this.matchAdministratorService.updateMultipleGroupMatches(req, res);
      case "knockout":
        return this.matchAdministratorService.updateMultipleKnockoutMatches(req, res);
      default:
        return this.matchAdministratorService.updateMultipleMatches(req, res);

    }
  }
  async createMultipleCustom(req: any, res: any) {
    return this.matchAdministratorService.createMultipleCustom(req, res);
  }
  async updateCustom(req: any, res: any) {
    return this.matchAdministratorService.updateCustom(req, res);
  }
  async list(req: any, res: any) {
    return this.matchService.list(req, res);
  }
  async detail(req: any, res: any) {
    return this.matchService.detail(req, res);
  }

  async updateScore(req: any, res: any) {
    return this.matchScoreService.updateScore(req, res);
  }
  async updateNextRound(req: any, res: any) {
    return this.matchScoreService.updateNextRound(req, res);
  }
  async updateVideoURL(req:any, res:any) {
    return this.matchAdministratorService.updateVideoURL(req, res);
  }
  async endMatch(req: any, res: any) {
    return this.matchScoreService.endMatch(req, res);
  }
  async updateMatchStatus(req: any, res: any) {
    return this.matchScoreService.updateMatchStatus(req, res);
  }
  async updateMatch(req: any, res: any) {
    return this.matchAdministratorService.updateMatch(req, res);
  }
  async updateTournamentGroup(req: any, res: any) {
    return this.matchAdministratorService.updatePlayerTeamGroup(req, res);
  }
  async updateTeamGroupOnly(req: any, res: any) {
    return this.matchAdministratorService.updateTeamGroupOnly(req, res);
  }
  async updateSetScore(req: any, res: any) {
    return this.matchScoreService.updateSetScore(req, res);
  }
  async endSet(req: any, res: any) {
    return this.matchScoreService.endSet(req, res);
  }
  async delete(req: any, res: any) {
    return this.matchAdministratorService.delete(req, res);
  }

  async getMatchesByPlayerUUID(playerUUID: string, statuses?: MatchStatus[]) {
    return this.matchService.getMatchesByPlayerUUID(playerUUID, statuses);
  } 

  async playerMatches(req: any, res: any) {
    return this.matchService.playerMatches(req, res);
  }
  // BEGIN: Public API
  async publicMatchList(req: any, res: any, status?: MatchStatus) {
    return this.matchService.publicMatchList(req, res, status);
  }

  async publicMatchDetail(req: any, res: any) {
    return this.matchService.publicMatchDetail(req, res);
  }
  async publicTournamentMatchList(req: any, res: any) {
    return this.matchService.publicTournamentMatchList(req, res);
  }
  async publicTournamentGroup(req: any, res: any) {
    return this.matchService.publicTournamentGroup(req, res);
  }

  async addReferee(req: any, res: any) {
    try {
      const { uuid } = req.params;
      const { referee_uuid, status } = req.body;

      // Validate required fields
      if (!referee_uuid || !status) {
        return res.status(400).json({
          success: false,
          message: 'referee_uuid and status are required',
        });
      }

      // Validate status enum
      if (!Object.values(MatchRefereeStatus).includes(status as MatchRefereeStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${Object.values(MatchRefereeStatus).join(', ')}`,
        });
      }

      // Check if match exists
      const match = await this.matchRepository.findOne({
        where: { uuid, deletedAt: IsNull() }
      });
      if (!match) {
        return res.status(404).json({
          success: false,
          message: 'Match not found',
        });
      }

      // Check if player exists
      const player = await this.playerRepository.findOne({
        where: { uuid: referee_uuid },
      });

      if (!player) {
        return res.status(404).json({
          success: false,
          message: 'Player not found',
        });
      }

      // Check if referee assignment already exists
      const existingAssignment = await this.matchRefereeRepository.findOne({
        where: {
          match_uuid: uuid,
          player_uuid: referee_uuid,
        },
      });

      if (existingAssignment) {
        return res.status(409).json({
          success: false,
          message: 'Player is already assigned as referee for this match',
        });
      }

      // Create new match referee assignment
      const matchReferee = this.matchRefereeRepository.create({
        match_uuid: uuid,
        player_uuid: referee_uuid,
        status: status as MatchRefereeStatus,
        createdBy: req.user?.uuid || null,
      });

      const savedMatchReferee = await this.matchRefereeRepository.save(matchReferee);

      return res.status(201).json({
        success: true,
        message: 'Referee assigned successfully',
        data: savedMatchReferee,
      });
    } catch (error) {
      console.error('Error assigning referee:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async fetchReferees(req: any, res: any) {
    try {
      const { match_uuid, player_uuid } = req.query;

      // Validate that at least one parameter is provided
      if (!match_uuid && !player_uuid) {
        return res.status(400).json({
          success: false,
          message: 'Either match_uuid or player_uuid query parameter is required',
        });
      }

      const data = await this.matchService.fetchReferees(
        match_uuid as string,
        player_uuid as string
      );

      return res.status(200).json({
        success: true,
        message: 'Referees fetched successfully',
        data,
      });
    } catch (error) {
      console.error('Error fetching referees:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
