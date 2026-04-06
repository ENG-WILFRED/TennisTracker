import path from 'path';
import grpc from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';

const PROTO_PATH = path.join(process.cwd(), 'proto', 'tennis.proto');
const packageDefinition = loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const protoDescriptor: Record<string, unknown> = grpc.loadPackageDefinition(packageDefinition);
const tennis = protoDescriptor.tennis as any;

export function getPlayerStats(playerId: string) {
  const client = new (tennis.Analytics as any)(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );
  return new Promise((resolve, reject) => {
    client.GetPlayerStats({ playerId }, (err: unknown, response: unknown) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

// example invocation when run directly
if (require.main === module) {
  getPlayerStats('some-player-id')
    .then((stats) => console.log('stats', stats))
    .catch(console.error);
}
