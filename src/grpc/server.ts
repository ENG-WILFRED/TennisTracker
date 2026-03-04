import path from 'path';
import { PrismaClient } from '../generated/prisma';
import { loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import grpc from '@grpc/grpc-js';

const prisma = new PrismaClient();

const PROTO_PATH = path.join(process.cwd(), 'proto', 'tennis.proto');

const packageDefinition = loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor: any = loadPackageDefinition(packageDefinition);
const tennis = protoDescriptor.tennis;

// Implement service
const analyticsService = {
  GetPlayerStats: async (call: any, callback: any) => {
    try {
      const { playerId } = call.request;
      const player = await prisma.player.findUnique({
        where: { userId: playerId },
        select: {
          matchesPlayed: true,
          matchesWon: true,
          matchesLost: true,
        },
      });

      if (!player) {
        return callback({ code: grpc.status.NOT_FOUND, details: 'Player not found' });
      }

      const result = {
        matchesPlayed: player.matchesPlayed || 0,
        matchesWon: player.matchesWon || 0,
        matchesLost: player.matchesLost || 0,
        matchesRefereed: 0, // placeholder
      };

      return callback(null, result);
    } catch (err) {
      console.error('gRPC GetPlayerStats error', err);
      return callback({ code: grpc.status.INTERNAL, details: 'Internal error' });
    }
  },
};

export function startServer(port = 50051) {
  const server = new grpc.Server();
  server.addService(tennis.Analytics.service, analyticsService);
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err: Error | null, bindPort: number) => {
      if (err) {
        console.error('gRPC server bind error', err);
      } else {
        server.start();
        console.log(`gRPC server listening on port ${bindPort}`);
      }
    }
  );
  return server;
}

// if run directly
if (require.main === module) {
  startServer();
}
