import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../../config.js';

const updateSourceSchema = z.object({
  enabled: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
  base_url: z.string().url().optional(),
});

export async function adminSourceRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/admin/sources
   * List all configured sources
   */
  fastify.get('/', async (request, reply) => {
    const { data: sources, error } = await supabase
      .from('app_sources')
      .select('*')
      .order('priority');
    
    if (error) {
      console.error('Error fetching sources:', error);
      return reply.code(500).send({ error: 'Failed to fetch sources' });
    }
    
    return sources || [];
  });
  
  /**
   * GET /api/admin/sources/:id
   * Get detailed source info
   */
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const { data: source, error } = await supabase
      .from('app_sources')
      .select(`
        *,
        app_source_versions (
          count,
          last_checked_at,
          last_status
        )
      `)
      .eq('id', id)
      .single();
    
    if (error || !source) {
      return reply.code(404).send({ error: 'Source not found' });
    }
    
    return source;
  });
  
  /**
   * PATCH /api/admin/sources/:id
   * Update source configuration
   */
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const updates = updateSourceSchema.parse(request.body);
    
    const { data: source, error } = await supabase
      .from('app_sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !source) {
      return reply.code(404).send({ error: 'Source not found' });
    }
    
    return source;
  });
}

