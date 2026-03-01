import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { initDb } from './db/index.js';
import { presetsRoutes } from './modules/presets/presets.routes.js';
import { transformRoutes } from './modules/transform/transform.routes.js';

const app = Fastify({
  logger: true,
  genReqId: () => crypto.randomUUID(),
});

await app.register(cors, { origin: true });
await app.register(presetsRoutes);
await app.register(transformRoutes);

initDb();

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
