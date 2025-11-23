import { BaseSourceProvider } from './base.js';
import type { AppMetadata } from '../types/index.js';

/**
 * Custom mirror source provider
 * 
 * This provider is designed for a custom APK mirror that you control.
 * It assumes a simple API structure:
 * 
 * GET /api/apps/:packageName - Returns app metadata and versions
 * GET /api/apps/:packageName/download?version=X - Returns direct download URL or streams APK
 * 
 * Implement your custom mirror to match this interface, or adapt this provider
 * to match your mirror's API.
 */
export class CustomMirrorProvider extends BaseSourceProvider {
  name = 'CustomMirror';
  type = 'custom' as const;
  
  async fetchMetadata(packageName: string): Promise<AppMetadata | null> {
    try {
      // Assuming custom mirror has a simple JSON API
      const apiUrl = `${this.baseUrl}/api/apps/${encodeURIComponent(packageName)}`;
      
      interface CustomMirrorResponse {
        package_name: string;
        display_name: string;
        short_description: string;
        full_description: string;
        icon_url: string;
        versions: Array<{
          version_name: string;
          version_code: number;
          download_url: string;
        }>;
      }
      
      const data = await this.fetchJson<CustomMirrorResponse>(apiUrl);
      
      if (!data) {
        console.log(`CustomMirror: No data found for ${packageName}`);
        return null;
      }
      
      return {
        packageName: data.package_name,
        displayName: data.display_name,
        shortDescription: data.short_description,
        fullDescription: data.full_description,
        iconUrl: data.icon_url,
        versions: data.versions.map(v => ({
          versionName: v.version_name,
          versionCode: v.version_code,
          downloadUrl: v.download_url,
        })),
      };
    } catch (error) {
      console.error(`CustomMirror: Error fetching metadata for ${packageName}:`, error);
      return null;
    }
  }
  
  async getDownloadUrl(packageName: string, versionCode?: number): Promise<string | null> {
    try {
      let apiUrl = `${this.baseUrl}/api/apps/${encodeURIComponent(packageName)}/download`;
      
      if (versionCode !== undefined) {
        apiUrl += `?version=${versionCode}`;
      }
      
      // The custom mirror should return a direct download URL
      interface DownloadResponse {
        download_url: string;
      }
      
      const data = await this.fetchJson<DownloadResponse>(apiUrl);
      
      if (!data?.download_url) {
        console.log(`CustomMirror: No download URL for ${packageName}`);
        return null;
      }
      
      return data.download_url;
    } catch (error) {
      console.error(`CustomMirror: Error getting download URL for ${packageName}:`, error);
      return null;
    }
  }
}

