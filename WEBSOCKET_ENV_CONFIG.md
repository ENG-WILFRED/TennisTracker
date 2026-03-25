# WebSocket Environment Configuration

## Overview

The WebSocket server and client can be configured using environment variables. This allows you to:
- Connect to different servers in development, staging, and production
- Use custom ports and hostnames
- Configure secure WebSocket connections (wss://)

## Environment Variables

### WebSocket Server Configuration

#### `WS_PORT` (Optional)
- **Type**: Number
- **Default**: `3001`
- **Description**: The port on which the WebSocket server listens
- **Example**: `WS_PORT=8080`
- **Use Case**: Change if port 3001 is already in use

#### `WS_HOST` (Optional)
- **Type**: String
- **Default**: `localhost`
- **Description**: The host/IP address the WebSocket server binds to
- **Example**: `WS_HOST=0.0.0.0` (listen on all interfaces)
- **Use Case**: Allow connections from other machines

### API Server Configuration

#### `WS_SERVER_URL` (Optional)
- **Type**: String
- **Default**: `http://localhost:3001`
- **Description**: The HTTP URL of the WebSocket server (used by API routes to broadcast messages)
- **Example**: 
  - Development: `WS_SERVER_URL=http://localhost:3001`
  - Staging: `WS_SERVER_URL=https://ws-staging.example.com:3001`
  - Production: `WS_SERVER_URL=https://api.example.com:3001`
- **Use Case**: Tell API routes where to send broadcast messages

### Client (Browser) Configuration

#### `NEXT_PUBLIC_WS_URL` (Optional)
- **Type**: String
- **Default**: Auto-detected (localhost:3001 in dev, same host in prod)
- **Description**: The WebSocket URL the browser uses to connect
- **Example**:
  - Development: `NEXT_PUBLIC_WS_URL=ws://localhost:3001`
  - Production: `NEXT_PUBLIC_WS_URL=wss://api.example.com:3001`
- **Use Case**: Override auto-detection or use custom WebSocket endpoint
- **Note**: Must be prefixed with `NEXT_PUBLIC_` to be available in browser

## Configuration Examples

### Development - Local

```bash
# Default (no env vars needed)
WS_PORT=3001
WS_HOST=localhost
WS_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Development - Remote Server

```bash
# If WebSocket server is running on different machine
WS_HOST=0.0.0.0                                    # Listen on all interfaces
WS_SERVER_URL=http://192.168.1.100:3001          # Internal network IP
NEXT_PUBLIC_WS_URL=ws://192.168.1.100:3001       # Browser connection
```

### Production - Secure

```bash
# HTTPS + secure WebSocket
WS_PORT=443
WS_HOST=0.0.0.0
WS_SERVER_URL=https://api.example.com:443
NEXT_PUBLIC_WS_URL=wss://api.example.com:443
```

### Production - Separate WebSocket Service

```bash
# WebSocket on subdomain
WS_SERVER_URL=https://ws.example.com:3001
NEXT_PUBLIC_WS_URL=wss://ws.example.com:3001
```

### Staging Environment

```bash
WS_PORT=3001
WS_HOST=0.0.0.0
WS_SERVER_URL=https://staging-api.example.com:3001
NEXT_PUBLIC_WS_URL=wss://staging-api.example.com:3001
```

## How Environment Variables are Used

### Starting WebSocket Server

```bash
# Use environment variables
WS_PORT=8080 WS_HOST=0.0.0.0 npm run websocket:dev

# Or set in .env.local
# Then run:
npm run websocket:dev
```

### Starting Next.js App

```bash
# Environment variables in .env.local automatically picked up
npm run dev
```

### Building for Production

```bash
# Set production environment variables
WS_SERVER_URL=https://api.example.com:3001 npm run build
NEXT_PUBLIC_WS_URL=wss://api.example.com:3001 npm run build
```

## File: .env.local (Development)

Create `./.env.local` to configure for your development environment:

```bash
# WebSocket Server Configuration
WS_PORT=3001
WS_HOST=localhost

# API Broadcast URL (Next.js → WebSocket server)
WS_SERVER_URL=http://localhost:3001

# Client WebSocket URL (Browser → WebSocket server)
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## File: .env.production (Production)

Create `./.env.production` for production deployment:

```bash
# WebSocket Server Configuration
WS_PORT=443
WS_HOST=0.0.0.0

# API Broadcast URL
WS_SERVER_URL=https://api.example.com:443

# Client WebSocket URL
NEXT_PUBLIC_WS_URL=wss://api.example.com:443
```

## Priority Order

Each component determines its configuration in this order:

### WebSocket Server (`src/websocket-server.ts`)
1. Command-line environment variables (e.g., `WS_PORT=8080 npm run websocket`)
2. `.env.local`, `.env.production`, or `.env` files
3. Hardcoded defaults (port: 3001, host: localhost)

### API Routes (`src/lib/websocket-broadcast.ts`)
1. Command-line environment variables
2. `.env.local`, `.env.production` files
3. Hardcoded default (http://localhost:3001)

### Client Hook (`src/hooks/useCommunityWebSocket.ts`)
1. `NEXT_PUBLIC_WS_URL` environment variable
2. Auto-detection:
   - Dev (localhost): `ws://localhost:3001`
   - Prod (other hosts): `ws://<same-host>`
   - HTTPS: Uses `wss://` instead of `ws://`

## Docker/Container Deployment

```dockerfile
FROM node:18

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

# Environment variables passed at runtime
ENV WS_PORT=3001
ENV WS_HOST=0.0.0.0
ENV WS_SERVER_URL=http://websocket-server:3001
ENV NEXT_PUBLIC_WS_URL=wss://api.example.com:3001

EXPOSE 3000
EXPOSE 3001

CMD ["npm", "run", "websocket", "&", "npm", "start"]
```

## Docker Compose Example

```yaml
version: '3.8'

services:
  websocket:
    image: node:18
    working_dir: /app
    volumes:
      - .:/app
    environment:
      WS_PORT: 3001
      WS_HOST: 0.0.0.0
    ports:
      - "3001:3001"
    command: npm run websocket

  nextjs:
    image: node:18
    working_dir: /app
    volumes:
      - .:/app
    environment:
      WS_SERVER_URL: http://websocket:3001
      NEXT_PUBLIC_WS_URL: wss://api.example.com:3001
    ports:
      - "3000:3000"
    depends_on:
      - websocket
    command: npm run dev
```

## Troubleshooting

### Client Not Connecting
1. Check `NEXT_PUBLIC_WS_URL` is set correctly
2. Verify browser console logs show correct URL
3. Check Network tab shows WebSocket upgrade (101)

### Broadcast Not Working
1. Check `WS_SERVER_URL` matches WebSocket server address
2. Verify WebSocket server is running
3. Check API logs for broadcast POST requests

### Port Already in Use
```bash
# Change port
WS_PORT=8080 npm run websocket:dev

# Or find what's using the port
lsof -i :3001
kill -9 <PID>
```

## Summary

| Component | Env Var | Default | Purpose |
|-----------|---------|---------|---------|
| WebSocket Server | `WS_PORT` | 3001 | Server port |
| WebSocket Server | `WS_HOST` | localhost | Server binding |
| API Routes | `WS_SERVER_URL` | http://localhost:3001 | Broadcast target |
| Client Hook | `NEXT_PUBLIC_WS_URL` | Auto-detect | Connection URL |

All variables are optional and have sensible defaults for development!
