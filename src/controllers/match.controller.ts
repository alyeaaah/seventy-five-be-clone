import { MatchStatus } from "../entities/Matches";
import { MatchAdministratorService } from "../services/match-administrator.service";
import { MatchScoreService } from "../services/match-score.service";
import { MatchService } from "../services/match.service";

export default class MatchController {
  private readonly matchAdministratorService: MatchAdministratorService;
  private readonly matchScoreService: MatchScoreService;
  private readonly matchService: MatchService;

  constructor() {
    this.matchAdministratorService = new MatchAdministratorService();
    this.matchScoreService = new MatchScoreService();
    this.matchService = new MatchService();
    
    // Bind all methods to preserve 'this' context when used as route handlers
    this.create = this.create.bind(this);
    this.createMultiple = this.createMultiple.bind(this);
    this.updateMultiple = this.updateMultiple.bind(this);
    this.createMultipleCustom = this.createMultipleCustom.bind(this);
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
    return this.matchAdministratorService.updateMultipleMatches(req, res);
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
}
