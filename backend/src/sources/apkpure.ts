import { BaseSourceProvider } from './base.js';
import type { AppMetadata, VersionMetadata } from '../types/index.js';
import * as cheerio from 'cheerio';

/**
 * APKPure source provider
 * Scrapes APKPure for APK download links
 */
export class APKPureProvider extends BaseSourceProvider {
  name = 'APKPure';
  type = 'apkpure' as const;
  
  async fetchMetadata(packageName: string): Promise<AppMetadata | null> {
    try {
      console.log(`APKPure: Searching for ${packageName}...`);
      
      // APKPure direct URL pattern
      const appUrl = `${this.baseUrl}/${packageName}/${packageName}`;
      const appHtml = await this.fetchHtml(appUrl);
      
      if (!appHtml) {
        // Try search if direct URL fails
        return await this.searchAndFetch(packageName);
      }
      
      const $ = cheerio.load(appHtml);
      
      // Extract metadata
      const displayName = $('.title_link h1').text().trim() || 
                         $('h1.title').text().trim() ||
                         packageName;
      
      const iconUrl = $('.icon img').attr('src') || 
                     $('.detail-icon img').attr('src') || 
                     '';
      
      const description = $('.description .content').text().trim() ||
                         $('.detail-body .description').text().trim() ||
                         'No description available';
      
      // Get version info
      const versionName = $('.details-sdk span:contains("Version")').parent().find('span').last().text().trim() ||
                         $('.ver').text().trim() ||
                         '1.0.0';
      
      // Find download button
      const downloadLink = $('.download_apk_news a').attr('href') ||
                          $('.download-btn').attr('href') ||
                          $('a.download_btn').attr('href') ||
                          '';
      
      let downloadUrl = '';
      if (downloadLink) {
        downloadUrl = downloadLink.startsWith('http') 
          ? downloadLink 
          : `${this.baseUrl}${downloadLink}`;
        
        // If it's a download page, get the actual APK URL
        if (downloadUrl.includes('/download')) {
          downloadUrl = await this.getActualDownloadUrl(downloadUrl);
        }
      }
      
      console.log(`✅ APKPure: Found ${displayName}`);
      
      return {
        packageName,
        displayName,
        shortDescription: description.substring(0, 200),
        fullDescription: description,
        iconUrl: iconUrl.startsWith('//') ? `https:${iconUrl}` : iconUrl,
        versions: [
          {
            versionName,
            versionCode: 1, // Would need to parse from page
            downloadUrl,
          },
        ],
      };
    } catch (error) {
      console.error(`APKPure: Error fetching metadata for ${packageName}:`, error);
      return null;
    }
  }
  
  async getDownloadUrl(packageName: string, versionCode?: number): Promise<string | null> {
    try {
      console.log(`APKPure: Getting download URL for ${packageName}...`);
      
      // Try direct app page URL
      const appUrl = `${this.baseUrl}/${packageName}/${packageName}`;
      const appHtml = await this.fetchHtml(appUrl);
      
      if (!appHtml) {
        console.log(`APKPure: Could not fetch app page`);
        return null;
      }
      
      const $ = cheerio.load(appHtml);
      
      // Find download link
      const downloadLink = $('.download_apk_news a').attr('href') ||
                          $('.download-btn').attr('href') ||
                          $('a.download_btn').attr('href') ||
                          $('a[href*="/download"]').first().attr('href');
      
      if (!downloadLink) {
        console.log(`APKPure: No download link found`);
        return null;
      }
      
      let downloadUrl = downloadLink.startsWith('http') 
        ? downloadLink 
        : `${this.baseUrl}${downloadLink}`;
      
      // If it's a download page URL, get the actual APK URL
      if (downloadUrl.includes('/download') || downloadUrl.includes('/downloading')) {
        downloadUrl = await this.getActualDownloadUrl(downloadUrl);
      }
      
      console.log(`✅ APKPure: Found download URL`);
      return downloadUrl;
    } catch (error) {
      console.error(`APKPure: Error getting download URL for ${packageName}:`, error);
      return null;
    }
  }
  
  /**
   * Search for app and fetch metadata
   */
  private async searchAndFetch(packageName: string): Promise<AppMetadata | null> {
    try {
      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(packageName)}`;
      const searchHtml = await this.fetchHtml(searchUrl);
      
      if (!searchHtml) return null;
      
      const $ = cheerio.load(searchHtml);
      
      // Find first result
      const firstResult = $('.search-res .first').first();
      if (firstResult.length === 0) {
        console.log(`APKPure: No search results found`);
        return null;
      }
      
      const appLink = firstResult.find('a').attr('href');
      if (!appLink) return null;
      
      const appUrl = appLink.startsWith('http') ? appLink : `${this.baseUrl}${appLink}`;
      
      // Recursively fetch the app page
      const appHtml = await this.fetchHtml(appUrl);
      if (!appHtml) return null;
      
      // Parse app page (similar to above)
      return await this.parseAppPage(appHtml, packageName);
    } catch (error) {
      console.error(`APKPure: Error in search:`, error);
      return null;
    }
  }
  
  /**
   * Parse app page HTML
   */
  private async parseAppPage(html: string, packageName: string): Promise<AppMetadata | null> {
    const $ = cheerio.load(html);
    
    const displayName = $('.title_link h1').text().trim() || packageName;
    const iconUrl = $('.icon img').attr('src') || '';
    const description = $('.description .content').text().trim() || 'No description available';
    const versionName = $('.ver').text().trim() || '1.0.0';
    
    return {
      packageName,
      displayName,
      shortDescription: description.substring(0, 200),
      fullDescription: description,
      iconUrl: iconUrl.startsWith('//') ? `https:${iconUrl}` : iconUrl,
      versions: [
        {
          versionName,
          versionCode: 1,
          downloadUrl: '',
        },
      ],
    };
  }
  
  /**
   * Get the actual APK download URL from a download page
   */
  private async getActualDownloadUrl(downloadPageUrl: string): Promise<string> {
    try {
      const html = await this.fetchHtml(downloadPageUrl);
      if (!html) return downloadPageUrl;
      
      const $ = cheerio.load(html);
      
      // Look for the actual download link
      const actualLink = $('a#download_link').attr('href') ||
                        $('a.download-btn').attr('href') ||
                        $('a[href$=".apk"]').attr('href');
      
      if (actualLink) {
        const fullUrl = actualLink.startsWith('http') 
          ? actualLink 
          : actualLink.startsWith('//')
          ? `https:${actualLink}`
          : `${this.baseUrl}${actualLink}`;
        
        return fullUrl;
      }
      
      return downloadPageUrl;
    } catch (error) {
      console.error(`APKPure: Error getting actual download URL:`, error);
      return downloadPageUrl;
    }
  }
}

