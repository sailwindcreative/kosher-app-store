// Vercel serverless function entry point
import { VercelRequest, VercelResponse } from '@vercel/node';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from '../src/config.js';
import { deviceRoutes } from '../src/routes/devices.js';
import { appRoutes } from '../src/routes/apps.js';
import { downloadRoutes } from '../src/routes/downloads.js';
import { adminRoutes } from '../src/routes/admin/index.js';

// Create Fastify instance
const fastify = Fastify({
  logger: false,
});

// Register CORS
await fastify.register(cors, {
  origin: '*',
  credentials: true,
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
await fastify.register(deviceRoutes, { prefix: '/api/devices' });
await fastify.register(appRoutes, { prefix: '/api/apps' });
await fastify.register(downloadRoutes, { prefix: '/api/downloads' });
await fastify.register(adminRoutes, { prefix: '/api/admin' });

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  console.error(error);
  
  if (error.name === 'ZodError') {
    return reply.code(400).send({
      error: 'Validation error',
      details: error.message,
    });
  }
  
  return reply.code(error.statusCode || 500).send({
    error: error.message || 'Internal server error',
  });
});

// Export handler for Vercel
export default async (req: VercelRequest, res: VercelResponse) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};

