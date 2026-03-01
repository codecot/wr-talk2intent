import type { FastifyInstance } from 'fastify';
import { transcribe } from './transcribe.service.js';

const ALLOWED_MIME_PREFIXES = ['audio/'];

export async function transcribeRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/transcribe', async (request, reply) => {
    const file = await request.file();

    if (!file) {
      return reply.status(400).send({ error: 'No audio file provided' });
    }

    if (!ALLOWED_MIME_PREFIXES.some((p) => file.mimetype.startsWith(p))) {
      return reply.status(400).send({ error: `Invalid MIME type: ${file.mimetype}` });
    }

    try {
      const buffer = await file.toBuffer();
      const projectId = file.fields?.projectId;
      const resolvedProjectId =
        projectId && typeof projectId === 'object' && 'value' in projectId
          ? (projectId.value as string)
          : undefined;
      const result = await transcribe(buffer, file.filename, resolvedProjectId || undefined);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      return reply.status(502).send({ error: message });
    }
  });
}
