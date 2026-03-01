import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { config } from './config.js';
import { initDb } from './db/index.js';
import { presetsRoutes } from './modules/presets/presets.routes.js';
import { transformRoutes } from './modules/transform/transform.routes.js';
import { transcribeRoutes } from './modules/transcribe/transcribe.routes.js';
import { projectsRoutes } from './modules/projects/projects.routes.js';

const app = Fastify({
  logger: true,
  genReqId: () => crypto.randomUUID(),
});

await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });
await app.register(presetsRoutes);
await app.register(transformRoutes);
await app.register(transcribeRoutes);
await app.register(projectsRoutes);

initDb();

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
