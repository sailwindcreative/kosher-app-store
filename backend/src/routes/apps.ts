import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../config.js';
import { validateDeviceId } from '../utils/validation.js';
import { createDownloadToken } from '../utils/crypto.js';
import { config } from '../config.js';

const downloadRequestSchema = z.object({
  device_id: z.string().uuid(),
});

export async function appRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/apps
   * List all apps for the client
   */
  fastify.get('/', async (request, reply) => {
    const { device_id } = request.query as { device_id?: string };
    
    // Update device last_seen if device_id provided
    if (device_id && validateDeviceId(device_id)) {
      await supabase
        .from('devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', device_id);
    }
    
    // Fetch all apps
    const { data: apps, error } = await supabase
      .from('apps')
      .select('id, display_name, short_description, icon_url, current_version_name, package_name')
      .order('display_name');
    
    if (error) {
      console.error('Error fetching apps:', error);
      return reply.code(500).send({ error: 'Failed to fetch apps' });
    }
    
    return apps || [];
  });
  
  /**
   * POST /api/apps/:appId/download
   * Request a download URL for an app
   */
  fastify.post('/:appId/download', async (request, reply) => {
    const { appId } = request.params as { appId: string };
    const body = downloadRequestSchema.parse(request.body);
    const { device_id } = body;
    
    if (!validateDeviceId(device_id)) {
      return reply.code(400).send({ error: 'Invalid device ID' });
    }
    
    // Verify device exists
    const { data: device } = await supabase
      .from('devices')
      .select('id')
      .eq('id', device_id)
      .single();
    
    if (!device) {
      return reply.code(404).send({ error: 'Device not registered' });
    }
    
    // Fetch app and its latest version
    const { data: app } = await supabase
      .from('apps')
      .select(`
        id,
        package_name,
        current_version_code,
        app_versions!inner (
          id,
          version_code,
          version_name
        )
      `)
      .eq('id', appId)
      .order('app_versions.version_code', { ascending: false })
      .limit(1)
      .single();
    
    if (!app) {
      return reply.code(404).send({ error: 'App not found' });
    }
    
    // Get the latest version
    const latestVersion = Array.isArray(app.app_versions) 
      ? app.app_versions[0] 
      : app.app_versions;
    
    if (!latestVersion) {
      return reply.code(404).send({ error: 'No versions available for this app' });
    }
    
    // Find best available source for this version
    const { data: sourcesData } = await supabase
      .from('app_source_versions')
      .select(`
        id,
        download_url,
        app_source_id,
        app_sources!inner (
          id,
          name,
          enabled,
          priority
        )
      `)
      .eq('app_version_id', latestVersion.id)
      .eq('app_sources.enabled', true)
      .order('app_sources.priority');
    
    if (!sourcesData || sourcesData.length === 0) {
      return reply.code(404).send({ error: 'No download sources available for this app' });
    }
    
    const bestSource = sourcesData[0];
    const sourceData = Array.isArray(bestSource.app_sources)
      ? bestSource.app_sources[0]
      : bestSource.app_sources;
    
    // Log download start event
    await supabase.from('download_events').insert({
      device_id,
      app_id: appId,
      app_version_id: latestVersion.id,
      app_source_id: sourceData.id,
      event_type: 'start',
    });
    
    // Create install record
    await supabase.from('installs').insert({
      device_id,
      app_id: appId,
      app_version_id: latestVersion.id,
      status: 'download_started',
    });
    
    // Generate download token
    const token = createDownloadToken({
      deviceId: device_id,
      appId,
      appVersionId: latestVersion.id,
      appSourceId: sourceData.id,
    });
    
    const downloadUrl = `${config.backend.url}/api/downloads/${token}`;
    
    return { download_url: downloadUrl };
  });
}

