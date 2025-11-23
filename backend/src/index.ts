import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { deviceRoutes } from './routes/devices.js';
import { appRoutes } from './routes/apps.js';
import { downloadRoutes } from './routes/downloads.js';
import { adminRoutes } from './routes/admin/index.js';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn',
  },
});

// Start server
const start = async () => {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: config.nodeEnv === 'development' ? '*' : process.env.ALLOWED_ORIGINS?.split(',') || '*',
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
      fastify.log.error(error);
      
      // Handle validation errors
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.message,
        });
      }
      
      // Generic error
      return reply.code(error.statusCode || 500).send({
        error: error.message || 'Internal server error',
      });
    });
    
    await fastify.listen({ 
      port: config.port, 
      host: '0.0.0.0',
    });
    
    console.log(`🚀 Server listening on port ${config.port}`);
    console.log(`📡 Health check: http://localhost:${config.port}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

