# WebSocket Implementation for Real-time Tennis Match Scores

This document describes the WebSocket implementation for real-time tennis match score updates.

## Overview

The WebSocket system provides real-time score updates for tennis matches using Socket.IO with bcrypt-based authentication.

## Architecture

### Backend (Node.js/Express)

#### Files Created/Modified:
- `src/websocket/index.ts` - WebSocket server with authentication
- `src/controllers/websocket.controller.ts` - WebSocket API endpoints
- `src/loader.ts` - WebSocket server initialization
- `src/app.ts` - Removed duplicate server creation
- `src/routes/route.ts` - Added WebSocket endpoints

#### Key Features:
- **Authentication**: Uses bcrypt to compare secret keys
- **Real-time Broadcasting**: Emits score updates to connected clients
- **Error Handling**: Comprehensive error handling and logging
- **Connection Management**: Automatic reconnection and cleanup

#### Environment Variables:
```env
SECRET_KEY=your_secret_key_here
WEBSOCKET_ENABLED=true
WEBSOCKET_PATH=/ws
WEBSOCKET_HEARTBEAT_INTERVAL=30000
WEBSOCKET_CONNECTION_TIMEOUT=120000
```

#### API Endpoints:
- `POST /api/websocket/broadcast-scores` - Broadcast multiple match scores
- `POST /api/websocket/broadcast-score/:matchUuid` - Broadcast single match score
- `GET /api/websocket/status` - Get WebSocket server status

#### Score Schema:
```typescript
interface MatchScoreData {
  matchUuid: string;
  score: {
    set: number;
    game: number;
    game_score_home: string | number;
    game_score_away: string | number;
  }[];
}
```

### Frontend (React/TypeScript)

#### Files Created/Modified:
- `src/utils/socket.ts` - WebSocket client utility
- `src/hooks/useMatchSocket.ts` - Custom React hook
- `src/pages/Public/Match/index.tsx` - Integration with match detail page

#### Key Features:
- **Authentication**: Uses same secret key as backend
- **Real-time Updates**: Automatic score updates via hook
- **Fallback**: Falls back to Firestore if WebSocket unavailable
- **Connection Management**: Auto-reconnect with exponential backoff

#### Environment Variables:
```env
VITE_SOCKET_SECRET_KEY=your_secret_key_here
VITE_API_BASE_URL=http://localhost:3000
```

#### Hook Usage:
```typescript
import { useMatchSocket } from '@/hooks/useMatchSocket';

const { matches, isConnected, error, connect, disconnect, reconnect } = useMatchSocket();
```

## Data Flow

1. **Connection**: Client connects with secret key authentication
2. **Authentication**: Server validates secret key using bcrypt
3. **Score Update**: Backend broadcasts score updates via WebSocket API
4. **Real-time Delivery**: Server emits `match_score_updated` event
5. **Client Update**: Hook updates React state with new scores
6. **UI Update**: Components re-render with updated scores

## Authentication Process

1. Client sends secret key in auth object during connection
2. Server hashes received secret key and compares with stored hash
3. Connection is only established if keys match
4. Failed connections are immediately terminated

## Usage Examples

### Backend - Broadcasting Scores

```typescript
// Broadcast multiple match scores
webSocketService.broadcastMatchScores([
  {
    matchUuid: "match-123",
    score: [
      { set: 1, game: 1, game_score_home: "15", game_score_away: "0" },
      { set: 1, game: 2, game_score_home: "30", game_score_away: "15" }
    ]
  }
]);

// Broadcast single match score
webSocketService.broadcastMatchScore("match-123", [
  { set: 1, game: 1, game_score_home: "15", game_score_away: "0" }
]);
```

### Frontend - Using the Hook

```typescript
const MyComponent = () => {
  const { matches, isConnected } = useMatchSocket();
  
  // Get scores for specific match
  const matchScores = matches.find(m => m.matchUuid === matchUuid)?.score || [];
  
  return (
    <div>
      <div>WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {matchScores.map((score, index) => (
        <div key={index}>
          Set {score.set}, Game {score.game}: {score.game_score_home} - {score.game_score_away}
        </div>
      ))}
    </div>
  );
};
```

## Error Handling

### Backend:
- Invalid secret keys are rejected with appropriate error messages
- Connection timeouts are handled gracefully
- Broadcasting errors are logged but don't crash the server

### Frontend:
- Connection failures are logged and can be retried
- Missing scores fall back to existing Firestore data
- Network errors trigger automatic reconnection attempts

## Security Considerations

1. **Secret Key Management**: Store secret keys securely in environment variables
2. **Authentication**: All connections must be authenticated
3. **CORS**: Configure appropriate CORS settings for production
4. **Rate Limiting**: Consider implementing rate limiting for WebSocket connections

## Deployment Notes

1. Ensure WebSocket port is open in firewall
2. Configure load balancers to support WebSocket connections
3. Set appropriate CORS origins for production domains
4. Monitor WebSocket connection counts and performance

## Testing

### Manual Testing:
1. Start backend server
2. Start frontend application
3. Update scores via WebSocket API endpoints
4. Verify real-time updates in frontend

### API Testing:
```bash
# Broadcast scores
curl -X POST http://localhost:3000/api/websocket/broadcast-scores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "matches": [
      {
        "matchUuid": "test-match",
        "score": [
          { "set": 1, "game": 1, "game_score_home": "15", "game_score_away": "0" }
        ]
      }
    ]
  }'
```

## Troubleshooting

### Common Issues:
1. **Connection Failed**: Check secret key configuration
2. **No Updates**: Verify WebSocket event listeners
3. **Authentication Errors**: Ensure bcrypt comparison is working
4. **CORS Issues**: Check CORS configuration

### Debug Logging:
- Backend: Check console for WebSocket connection logs
- Frontend: Check browser console for connection status and errors
