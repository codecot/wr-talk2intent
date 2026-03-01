import type { FastifyInstance } from 'fastify';
import { getProjectById } from '../projects/projects.service.js';
import { uploadFile, reindexProject, queryProject } from './rag.service.js';

export async function ragRoutes(app: FastifyInstance): Promise<void> {
  // Upload a file to a project's vault
  app.post('/api/projects/:id/files', async (request, reply) => {
    const { id } = request.params as { id: string };

    const project = getProjectById(id);
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    const subfolder =
      (data.fields.subfolder as { value?: string } | undefined)?.value ?? 'docs';
    const buffer = await data.toBuffer();

    const result = await uploadFile(id, data.filename, buffer, subfolder);
    return reply.status(201).send(result);
  });

  // Reindex all files in a project's vault
  app.post('/api/projects/:id/reindex', async (request, reply) => {
    const { id } = request.params as { id: string };

    const project = getProjectById(id);
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    try {
      const result = await reindexProject(id);
      return reply.send(result);
    } catch (err) {
      request.log.error(err, 'Reindex failed');
      return reply.status(502).send({ error: 'Embedding service unavailable' });
    }
  });

  // Query indexed chunks via semantic similarity
  app.post('/api/rag/query', async (request, reply) => {
    const { projectId, query, topK } = request.body as {
      projectId?: string;
      query?: string;
      topK?: number;
    };

    if (!projectId || !query) {
      return reply
        .status(400)
        .send({ error: 'projectId and query are required' });
    }

    const project = getProjectById(projectId);
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    try {
      const result = await queryProject(projectId, query, topK ?? 5);
      return reply.send(result);
    } catch (err) {
      request.log.error(err, 'RAG query failed');
      return reply.status(502).send({ error: 'Embedding service unavailable' });
    }
  });
}
