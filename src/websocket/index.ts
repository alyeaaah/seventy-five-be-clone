import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import bcrypt from 'bcryptjs';
import config from '../config';

interface AuthenticatedSocket extends Socket {
  authenticated: boolean;
}

interface MatchScoreData {
  matchUuid: string;
  score: {
    set: number;
    game: number;
    game_score_home: string | number;
    game_score_away: string | number;
  }[];
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private secretKey: string;

  constructor() {
    this.secretKey = config.websocket.secretKey;
    console.log('WebSocket service initialized with secret key:', this.secretKey ? 'Set' : 'Missing');
  }

  initialize(server: HTTPServer) {
    console.log('Initializing WebSocket server...');
    
    try {
      // Simple Socket.IO setup
      this.io = new SocketIOServer(server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      console.log('Socket.IO server created');
      
      this.io.use(this.authenticateSocket.bind(this));

      this.io.on('connection', (socket: Socket) => {
        console.log('New WebSocket connection attempt');
        if (!(socket as AuthenticatedSocket).authenticated) {
          console.log('Connection rejected - not authenticated');
          socket.disconnect();
          return;
        }

        console.log('WebSocket client authenticated and connected');

        socket.on('disconnect', () => {
          console.log('WebSocket client disconnected');
        });
      });

      console.log('WebSocket server initialized with authentication');
    } catch (error) {
      console.error('Error initializing WebSocket server:', error);
    }
  }

  private async authenticateSocket(socket: Socket, next: (err?: Error) => void) {
    try {
      console.log('Authentication attempt - checking handshake auth...');
      const secretKey = socket.handshake.auth.secretKey;
      
      console.log('Received secret key:', secretKey ? 'Provided' : 'Missing');
      console.log('Expected secret key:', this.secretKey ? 'Set' : 'Missing');
      
      if (!secretKey) {
        console.log('Authentication failed - No secret key provided');
        return next(new Error('Authentication failed: No secret key provided'));
      }

      // Simple string comparison for now (can be enhanced to use bcrypt later)
      const isMatch = secretKey === this.secretKey;
      
      if (!isMatch) {
        console.log('Authentication failed - keys do not match');
        console.log('Received key:', secretKey);
        console.log('Expected key:', this.secretKey);
        return next(new Error('Authentication failed: Invalid key'));
      }

      (socket as AuthenticatedSocket).authenticated = true;
      console.log('WebSocket authentication successful');
      next();
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  broadcastMatchScores(matches: MatchScoreData[]) {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.emit('match_score_updated', matches);
  }

  broadcastMatchScore(matchUuid: string, scores: MatchScoreData['score']) {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.emit('match_score_updated', [{ matchUuid, score: scores }]);
  }

  getIo() {
    return this.io;
  }
}

export default new WebSocketService();
