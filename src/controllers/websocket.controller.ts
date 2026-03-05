import { Request, Response } from 'express';
import webSocketService from '../websocket';
import { MatchScoreService } from '../services/match-score.service';

interface GameScore {
  set: number;
  game: number;
  game_score_home: string | number;
  game_score_away: string | number;
}

interface MatchScoreUpdate {
  matchUuid: string;
  game_scores: GameScore[];
}

export class WebSocketController {
  static async broadcastMatchScores(req: Request, res: Response) {
    try {
      const { matches } = req.body;

      if (!Array.isArray(matches)) {
        return res.status(400).json({
          success: false,
          message: 'Matches must be an array'
        });
      }

      const validatedMatches: MatchScoreUpdate[] = matches.map(match => ({
        matchUuid: match.matchUuid,
        game_scores: match.game_scores.map((game: any) => ({
          set: game.set,
          game: game.game,
          game_score_home: game.game_score_home,
          game_score_away: game.game_score_away
        }))
      }));

      // Convert to MatchScoreData format for WebSocket
      const matchScoreData = validatedMatches.map(match => ({
        matchUuid: match.matchUuid,
        score: match.game_scores
      }));

      webSocketService.broadcastMatchScores(matchScoreData);

      return res.json({
        success: true,
        message: 'Match scores broadcasted successfully',
        data: validatedMatches
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async broadcastSingleMatchScore(req: Request, res: Response) {
    try {
      const { matchUuid } = req.params;
      const { score } = req.body;

      if (!matchUuid || !Array.isArray(score)) {
        return res.status(400).json({
          success: false,
          message: 'matchUuid and score array are required'
        });
      }

      const validatedScore: GameScore[] = score.map(game => ({
        set: Number(game.set) || 1,
        game: Number(game.game) || 1,
        game_score_home: game.game_score_home?.toString() || "0",
        game_score_away: game.game_score_away?.toString() || "0"
      }));

      webSocketService.broadcastMatchScore(matchUuid, validatedScore);

      res.json({
        success: true,
        message: 'Match score broadcasted successfully',
        data: { matchUuid, score: validatedScore }
      });
    } catch (error) {
      console.error('Error broadcasting match score:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async broadcastOngoingMatchScores(req: Request, res: Response) {
    try {
      const matchScoreService = new MatchScoreService();
      const ongoingMatches = await matchScoreService.getAllOngoingMatchScores();

      // Convert to MatchScoreData format for WebSocket
      const matchScoreData = ongoingMatches.map(match => ({
        matchUuid: match.matchUuid,
        score: match.game_scores
      }));

      webSocketService.broadcastMatchScores(matchScoreData);

      return res.json({
        success: true,
        message: 'Ongoing match scores broadcasted successfully',
        data: ongoingMatches
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getWebSocketStatus(req: Request, res: Response) {
    try {
      const io = webSocketService.getIo();
      
      if (!io) {
        return res.json({
          success: true,
          message: 'WebSocket server not initialized',
          connected: false
        });
      }

      const sockets = await io.fetchSockets();
      
      res.json({
        success: true,
        message: 'WebSocket server status',
        connected: true,
        activeConnections: sockets.length
      });
    } catch (error) {
      console.error('Error getting WebSocket status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
