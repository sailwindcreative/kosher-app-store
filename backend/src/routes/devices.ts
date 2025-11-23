import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../config.js';
import { validateDeviceId } from '../utils/validation.js';

const registerDeviceSchema = z.object({
  device_id: z.string().uuid(),
  app_version: z.string().optional(),
});

export async function deviceRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/devices/register
   * Register or update a device
   */
  fastify.post('/register', async (request, reply) => {
    const body = registerDeviceSchema.parse(request.body);
    const { device_id, app_version } = body;
    
    if (!validateDeviceId(device_id)) {
      return reply.code(400).send({ error: 'Invalid device ID format' });
    }
    
    const clientIp = request.headers['x-forwarded-for'] || request.ip;
    
    // Check if device exists
    const { data: existing } = await supabase
      .from('devices')
      .select('id')
      .eq('id', device_id)
      .single();
    
    if (existing) {
      // Update last seen
      await supabase
        .from('devices')
        .update({
          last_seen_at: new Date().toISOString(),
          last_ip: clientIp,
        })
        .eq('id', device_id);
    } else {
      // Create new device
      await supabase
        .from('devices')
        .insert({
          id: device_id,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          last_ip: clientIp,
        });
    }
    
    return { device_id, status: 'ok' };
  });
}

