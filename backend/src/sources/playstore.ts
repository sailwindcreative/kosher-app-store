import { BaseSourceProvider } from './base.js';
import type { AppMetadata } from '../types/index.js';
import * as cheerio from 'cheerio';

/**
 * Google Play Store metadata scraper
 * Fetches app information from Play Store (metadata only, not APK downloads)
 */
export class PlayStoreProvider extends BaseSourceProvider {
  name = 'Google Play Store';
  type = 'custom' as const;
  
  async fetchMetadata(packageName: string): Promise<AppMetadata | null> {
    try {
      const playUrl = `https://play.google.com/store/apps/details?id=${packageName}&hl=en&gl=US`;
      const html = await this.fetchHtml(playUrl);
      
      if (!html) {
        console.log(`PlayStore: Could not fetch page for ${packageName}`);
        return null;
      }
      
      const $ = cheerio.load(html);
      
      // Extract app name
      const displayName = $('h1[itemprop="name"]').text().trim() || 
                         $('h1.Fd93Bb').text().trim() ||
                         packageName;
      
      // Extract icon URL
      let iconUrl = $('img[itemprop="image"]').attr('src') || 
                    $('img.T75of').attr('src') ||
                    `https://via.placeholder.com/512/1976D2/FFFFFF?text=${displayName.charAt(0)}`;
      
      // Fix relative URLs
      if (iconUrl && iconUrl.startsWith('//')) {
        iconUrl = 'https:' + iconUrl;
      }
      
      // Extract description
      const shortDescription = $('meta[name="description"]').attr('content') || 
                              $('div[itemprop="description"]').first().text().trim().substring(0, 200) ||
                              'No description available';
      
      const fullDescription = $('div[itemprop="description"]').text().trim() || 
                             shortDescription;
      
      // Extract version (if available in page)
      const versionText = $('div:contains("Current Version")').next().text().trim() ||
                         $('div.hAyfc:contains("Current Version")').next().text().trim() ||
                         '1.0.0';
      
      console.log(`✅ PlayStore: Successfully fetched metadata for ${packageName}`);
      
      return {
        packageName,
        displayName,
        shortDescription: shortDescription.substring(0, 200),
        fullDescription,
        iconUrl,
        playUrl,
        versions: [
          {
            versionName: versionText,
            versionCode: 1, // We don't know the actual version code
            downloadUrl: '', // Play Store doesn't provide direct download URLs
          },
        ],
      };
    } catch (error) {
      console.error(`PlayStore: Error fetching metadata for ${packageName}:`, error);
      return null;
    }
  }
  
  async getDownloadUrl(packageName: string, versionCode?: number): Promise<string | null> {
    // Play Store doesn't provide direct APK downloads
    // This would need to be filled in from APKMirror/APKPure/custom sources
    console.log(`PlayStore: Cannot provide download URL (use APKMirror/APKPure instead)`);
    return null;
  }
}

