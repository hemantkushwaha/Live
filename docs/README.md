# LiveConnect - Project Documentation

## Version 0.0.1 (Sprint 1 - EWO-001)

LiveConnect is a real-time communication platform designed for public live streaming and instant 1-on-1 private video communication.

### Project Architecture Overview
- **Frontend**: React 19, Vite, Tailwind CSS, Socket.io Client, Lucide React
- **Backend**: Node.js, Express, Socket.io, TypeScript
- **Shared**: Shared domain types, constants, socket event definitions

### API Contracts
- `GET /api/v1/health` -> Standard health check response:
  ```json
  {
    "success": true,
    "message": "Server running",
    "timestamp": "<ISO-timestamp>"
  }
  ```

### Socket Server
- Socket.io instance listening on port 3000
- Logs client connections and disconnections
