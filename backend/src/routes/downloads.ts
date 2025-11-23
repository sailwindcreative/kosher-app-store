import type { FastifyInstance } from 'fastify';
import { supabase } from '../config.js';
import { verifyDownloadToken } from '../utils/crypto.js';
import { validateSourceUrl } from '../utils/validation.js';
import fetch from 'node-fetch';
import { pipeline } from 'stream/promises';

export async function downloadRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/downloads/:token
   * Stream APK file to client using a signed token
   */
  fastify.get('/:token', async (request, reply) => {
    const { token } = request.params as { token: string };
    
    // Verify token
    const payload = verifyDownloadToken(token);
    if (!payload) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
    
    const { deviceId, appId, appVersionId, appSourceId } = payload;
    
    // Fetch the download URL from database
    const { data: sourceVersion } = await supabase
      .from('app_source_versions')
      .select('download_url')
      .eq('app_version_id', appVersionId)
      .eq('app_source_id', appSourceId)
      .single();
    
    if (!sourceVersion) {
      await supabase.from('download_events').insert({
        device_id: deviceId,
        app_id: appId,
        app_version_id: appVersionId,
        app_source_id: appSourceId,
        event_type: 'failure',
        error_message: 'Source version not found',
      });
      return reply.code(404).send({ error: 'Download source not found' });
    }
    
    const downloadUrl = sourceVersion.download_url;
    
    // Validate URL is from allowed source
    if (!validateSourceUrl(downloadUrl)) {
      await supabase.from('download_events').insert({
        device_id: deviceId,
        app_id: appId,
        app_version_id: appVersionId,
        app_source_id: appSourceId,
        event_type: 'failure',
        error_message: 'Invalid source URL',
      });
      return reply.code(403).send({ error: 'Invalid download source' });
    }
    
    try {
      // Stream the APK from the source to the client
      const response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 60000,
      });
      
      if (!response.ok) {
        throw new Error(`Source returned ${response.status}`);
      }
      
      // Set appropriate headers
      reply.header('Content-Type', 'application/vnd.android.package-archive');
      reply.header('Content-Disposition', 'attachment; filename="app.apk"');
      
      if (response.headers.get('content-length')) {
        reply.header('Content-Length', response.headers.get('content-length')!);
      }
      
      // Stream the response
      await pipeline(response.body as any, reply.raw);
      
      // Log success
      await supabase.from('download_events').insert({
        device_id: deviceId,
        app_id: appId,
        app_version_id: appVersionId,
        app_source_id: appSourceId,
        event_type: 'success',
      });
      
      // Update install status
      await supabase
        .from('installs')
        .update({ status: 'delivered' })
        .eq('device_id', deviceId)
        .eq('app_id', appId)
        .eq('app_version_id', appVersionId);
      
    } catch (error) {
      console.error('Download error:', error);
      
      await supabase.from('download_events').insert({
        device_id: deviceId,
        app_id: appId,
        app_version_id: appVersionId,
        app_source_id: appSourceId,
        event_type: 'failure',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      
      if (!reply.sent) {
        return reply.code(500).send({ error: 'Failed to download APK' });
      }
    }
  });
}

