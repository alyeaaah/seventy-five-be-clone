import { AppDataSource } from '../data-source';
import { PlayerTeam } from '../entities/PlayerTeam';
import { Matches } from '../entities/Matches';
import { PlayerTitles } from '../entities/PlayerTitles';

export class PlayerModel {
  private playerTeamRepo = AppDataSource.getRepository(PlayerTeam);
  private matchesRepo = AppDataSource.getRepository(Matches);
  private playerTitlesRepo = AppDataSource.getRepository(PlayerTitles);

  async getMatchesPlayed(teamUuids: string[]): Promise<number> {
    return await this.matchesRepo
      .createQueryBuilder('match')
      .where('match.home_team_uuid IN (:...teamUuids) OR match.away_team_uuid IN (:...teamUuids)', { teamUuids })
      .andWhere('match.status = :status', { status: 'ENDED' })
      .andWhere('match.deletedAt IS NULL')
      .getCount();
  }

  async getWonMatches(teamUuids: string[]): Promise<number> {
    return await this.matchesRepo
      .createQueryBuilder('match')
      .where('match.winner_team_uuid IN (:...teamUuids)', { teamUuids })
      .andWhere('match.status = :status', { status: 'ENDED' })
      .andWhere('match.deletedAt IS NULL')
      .getCount();
  }

  async getLostMatches(teamUuids: string[]): Promise<number> {
    return await this.matchesRepo
      .createQueryBuilder('match')
      .where('(match.home_team_uuid IN (:...teamUuids) OR match.away_team_uuid IN (:...teamUuids))', { teamUuids })
      .andWhere('match.winner_team_uuid NOT IN (:...teamUuids)', { teamUuids })
      .andWhere('match.status = :status', { status: 'ENDED' })
      .andWhere('match.deletedAt IS NULL')
      .getCount();
  }

  async getTournamentsPlayed(playerUuid: string): Promise<number> {
    const result = await this.playerTeamRepo
      .createQueryBuilder('playerTeam')
      .leftJoin('playerTeam.tournament', 'tournament')
      .select('COUNT(DISTINCT playerTeam.tournament_uuid)', 'count')
      .where('playerTeam.player_uuid = :uuid', { uuid: playerUuid })
      .andWhere('playerTeam.tournament_uuid IS NOT NULL')
      .andWhere('playerTeam.deletedAt IS NULL')
      .andWhere('(tournament.status = "ONGOING" OR tournament.status = "ENDED")')
      .getRawOne();
    
    return parseInt(result?.count || '0');
  }

  async getTitlesCount(playerUuid: string): Promise<number> {
    return await this.playerTitlesRepo.count({
      where: { 
        player_uuid: playerUuid,
        deletedAt: undefined
      }
    });
  }

  async getAllPlayerStats(playerUuid: string, teamUuids: string[]) {
    return await Promise.all([
      this.getMatchesPlayed(teamUuids),
      this.getWonMatches(teamUuids),
      this.getTournamentsPlayed(playerUuid),
      this.getTitlesCount(playerUuid)
    ]);
  }
}
