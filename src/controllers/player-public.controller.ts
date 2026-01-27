import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Player } from '../entities/Player';
import { PlayerTeam } from '../entities/PlayerTeam';
import RedisLib from '../lib/redis.lib';
import Util from '../lib/util.lib';
import { PlayerModel } from '../models/player.model';

export default class PlayerPublicController {
  async getPlayerStats(req: Request, res: Response) {
    const utilLib = Util.getInstance();
    const redis = RedisLib.getInstance();
    const { uuid } = req.params;

    try {
      const redisKey = `player-stats:${uuid}`;
      const cachedStats = await redis.redisget(redisKey);
      
      if (cachedStats) {
        utilLib.loggingRes(req, { data: cachedStats, cached: true });
        return res.json({ data: cachedStats, cached: true });
      }

      const playerRepo = AppDataSource.getRepository(Player);
      const playerTeamRepo = AppDataSource.getRepository(PlayerTeam);
      const playerModel = new PlayerModel();

      const player = await playerRepo.findOne({ where: { uuid } });
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const playerTeams = await playerTeamRepo.find({
        where: { player_uuid: uuid, deletedAt: undefined },
        relations: ['team']
      });

      const teamUuids = playerTeams.map(pt => pt.team_uuid).filter((uuid): uuid is string => uuid !== undefined);

      const [matchesPlayed, wonMatches, lostMatches, tournamentsPlayed, titlesCount] = await Promise.all([
        playerModel.getMatchesPlayed(teamUuids),
        playerModel.getWonMatches(teamUuids),
        playerModel.getLostMatches(teamUuids),
        playerModel.getTournamentsPlayed(uuid),
        playerModel.getTitlesCount(uuid)
      ]);

      const stats = {
        matches: matchesPlayed || 0,
        wins: wonMatches || 0,
        loses: lostMatches || 0,
        tournaments: tournamentsPlayed || 0,
        titles: titlesCount || 0
      };

      await redis.redisset(redisKey, stats, 60 * 60 * 24);

      utilLib.loggingRes(req, { data: stats });
      return res.json({ data: stats });

    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
