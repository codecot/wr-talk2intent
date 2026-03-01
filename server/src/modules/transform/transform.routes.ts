import type { FastifyInstance } from 'fastify';
import { transform } from './transform.service.js';

interface TransformBody {
  presetId: string;
  text: string;
  projectId?: string;
}

export async function transformRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: TransformBody }>('/api/transform', async (request, reply) => {
    const { presetId, text, projectId } = request.body;

    if (!presetId || !text) {
      return reply.status(400).send({ error: 'presetId and text are required' });
    }

    try {
      const result = await transform(presetId, text, projectId || undefined);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transform failed';
      if (message.includes('Preset not found')) {
        return reply.status(404).send({ error: message });
      }
      throw err;
    }
  });
}
