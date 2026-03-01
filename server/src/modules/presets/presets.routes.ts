import type { FastifyInstance } from 'fastify';
import { getPresets } from './presets.service.js';

export async function presetsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/presets', async () => {
    const presets = getPresets();
    return presets.map(({ id, name, description }) => ({ id, name, description }));
  });
}
