import type { FastifyInstance } from 'fastify';
import { adminAppRoutes } from './apps.js';
import { adminSourceRoutes } from './sources.js';

/**
 * Admin routes - should be protected with authentication
 * 
 * TODO: Add authentication middleware using Supabase Auth
 * For now, these routes are unprotected for development
 */
export async function adminRoutes(fastify: FastifyInstance) {
  // TODO: Add auth middleware here
  // fastify.addHook('onRequest', async (request, reply) => {
  //   const token = request.headers.authorization?.replace('Bearer ', '');
  //   if (!token) {
  //     return reply.code(401).send({ error: 'Unauthorized' });
  //   }
  //   
  //   const { data, error } = await supabaseAnon.auth.getUser(token);
  //   if (error || !data.user) {
  //     return reply.code(401).send({ error: 'Invalid token' });
  //   }
  //   
  //   request.user = data.user;
  // });
  
  fastify.register(adminAppRoutes, { prefix: '/apps' });
  fastify.register(adminSourceRoutes, { prefix: '/sources' });
}

