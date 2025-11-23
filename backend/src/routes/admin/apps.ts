import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../../config.js';
import { extractPackageNameFromPlayUrl, validatePackageName } from '../../utils/validation.js';
import { createSourceProvider } from '../../sources/index.js';
import type { AppSource } from '../../types/index.js';

const addAppSchema = z.object({
  play_url: z.string().optional(),
  package_name: z.string().optional(),
}).refine(data => data.play_url || data.package_name, {
  message: 'Either play_url or package_name must be provided',
});

export async function adminAppRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/admin/apps
   * List all apps with stats
   */
  fastify.get('/', async (request, reply) => {
    const { data: apps, error } = await supabase
      .from('apps')
      .select(`
        *,
        app_versions (count)
      `)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching apps:', error);
      return reply.code(500).send({ error: 'Failed to fetch apps' });
    }
    
    return apps || [];
  });
  
  /**
   * GET /api/admin/apps/:id
   * Get detailed app info including versions and sources
   */
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const { data: app, error } = await supabase
      .from('apps')
      .select(`
        *,
        app_versions (
          *,
          app_source_versions (
            *,
            app_sources (*)
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error || !app) {
      return reply.code(404).send({ error: 'App not found' });
    }
    
    // Get recent download events
    const { data: events } = await supabase
      .from('download_events')
      .select('*')
      .eq('app_id', id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    return {
      ...app,
      recent_events: events || [],
    };
  });
  
  /**
   * POST /api/admin/apps
   * Add a new app by scraping metadata from sources
   */
  fastify.post('/', async (request, reply) => {
    const body = addAppSchema.parse(request.body);
    
    // Determine package name
    let packageName: string | null = null;
    let playUrl: string | null = null;
    
    if (body.play_url) {
      playUrl = body.play_url;
      packageName = extractPackageNameFromPlayUrl(body.play_url);
      if (!packageName) {
        return reply.code(400).send({ error: 'Invalid Play Store URL' });
      }
    } else if (body.package_name) {
      packageName = body.package_name;
      if (!validatePackageName(packageName)) {
        return reply.code(400).send({ error: 'Invalid package name format' });
      }
    }
    
    if (!packageName) {
      return reply.code(400).send({ error: 'Could not determine package name' });
    }
    
    // Check if app already exists
    const { data: existingApp } = await supabase
      .from('apps')
      .select('id, package_name')
      .eq('package_name', packageName)
      .single();
    
    if (existingApp) {
      return reply.code(409).send({ 
        error: 'App already exists',
        app_id: existingApp.id,
      });
    }
    
    // Fetch enabled sources
    const { data: sources } = await supabase
      .from('app_sources')
      .select('*')
      .eq('enabled', true)
      .order('priority');
    
    if (!sources || sources.length === 0) {
      return reply.code(500).send({ error: 'No enabled sources available' });
    }
    
    // Try each source until we get metadata
    let appMetadata = null;
    let successfulSource: AppSource | null = null;
    
    for (const source of sources) {
      try {
        const provider = createSourceProvider(source);
        appMetadata = await provider.fetchMetadata(packageName);
        
        if (appMetadata) {
          successfulSource = source;
          break;
        }
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
      }
    }
    
    if (!appMetadata || !successfulSource) {
      return reply.code(404).send({ 
        error: 'Could not fetch app metadata from any source',
      });
    }
    
    // Create app record
    const latestVersion = appMetadata.versions[0];
    const { data: newApp, error: appError } = await supabase
      .from('apps')
      .insert({
        package_name: packageName,
        play_url: playUrl || appMetadata.playUrl,
        display_name: appMetadata.displayName,
        short_description: appMetadata.shortDescription,
        full_description: appMetadata.fullDescription,
        icon_url: appMetadata.iconUrl,
        current_version_name: latestVersion?.versionName,
        current_version_code: latestVersion?.versionCode,
      })
      .select()
      .single();
    
    if (appError || !newApp) {
      console.error('Error creating app:', appError);
      return reply.code(500).send({ error: 'Failed to create app' });
    }
    
    // Create version records and link to sources
    for (const version of appMetadata.versions) {
      const { data: newVersion } = await supabase
        .from('app_versions')
        .insert({
          app_id: newApp.id,
          version_name: version.versionName,
          version_code: version.versionCode,
        })
        .select()
        .single();
      
      if (newVersion) {
        // Link version to source
        await supabase
          .from('app_source_versions')
          .insert({
            app_version_id: newVersion.id,
            app_source_id: successfulSource.id,
            download_url: version.downloadUrl,
            last_checked_at: new Date().toISOString(),
            last_status: 'ok',
          });
      }
    }
    
    return newApp;
  });
  
  /**
   * POST /api/admin/apps/:id/test-fetch
   * Test fetching from all sources for an app
   */
  fastify.post('/:id/test-fetch', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    // Get app
    const { data: app } = await supabase
      .from('apps')
      .select('package_name')
      .eq('id', id)
      .single();
    
    if (!app) {
      return reply.code(404).send({ error: 'App not found' });
    }
    
    // Get all enabled sources
    const { data: sources } = await supabase
      .from('app_sources')
      .select('*')
      .eq('enabled', true)
      .order('priority');
    
    if (!sources) {
      return reply.code(500).send({ error: 'Failed to fetch sources' });
    }
    
    const results = [];
    
    // Test each source
    for (const source of sources) {
      const checkedAt = new Date().toISOString();
      
      try {
        const provider = createSourceProvider(source);
        const metadata = await provider.fetchMetadata(app.package_name);
        
        if (metadata && metadata.versions.length > 0) {
          results.push({
            source_id: source.id,
            source_name: source.name,
            status: 'success' as const,
            url: metadata.versions[0].downloadUrl,
            checked_at: checkedAt,
          });
        } else {
          results.push({
            source_id: source.id,
            source_name: source.name,
            status: 'failure' as const,
            error: 'No metadata or versions found',
            checked_at: checkedAt,
          });
        }
      } catch (error) {
        results.push({
          source_id: source.id,
          source_name: source.name,
          status: 'failure' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
          checked_at: checkedAt,
        });
      }
    }
    
    return { results };
  });
}

