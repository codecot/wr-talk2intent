import type { FastifyInstance } from 'fastify';
import { createProject, listProjects, getProjectById } from './projects.service.js';

interface CreateProjectBody {
  title: string;
}

export async function projectsRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: CreateProjectBody }>('/api/projects', async (request, reply) => {
    const { title } = request.body;

    if (!title?.trim()) {
      return reply.status(400).send({ error: 'title is required' });
    }

    const project = await createProject(title.trim());
    return reply.status(201).send(project);
  });

  app.get('/api/projects', async () => {
    return listProjects();
  });

  app.get<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
    const project = getProjectById(request.params.id);
    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }
    return project;
  });
}
