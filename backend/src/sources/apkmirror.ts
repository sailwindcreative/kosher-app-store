import { BaseSourceProvider } from './base.js';
import type { AppMetadata } from '../types/index.js';
import * as cheerio from 'cheerio';

/**
 * APKMirror source provider
 * Scrapes APKMirror for APK download links
 */
export class APKMirrorProvider extends BaseSourceProvider {
  name = 'APKMirror';
  type = 'apkmirror' as const;
  
  async fetchMetadata(packageName: string): Promise<AppMetadata | null> {
    try {
      console.log(`APKMirror: Searching for ${packageName}...`);
      
      // Search for the app
      const searchUrl = `${this.baseUrl}/?s=${encodeURIComponent(packageName)}&post_type=app_release&searchtype=apk`;
      const searchHtml = await this.fetchHtml(searchUrl);
      
      if (!searchHtml) {
        console.log(`APKMirror: Could not fetch search results`);
        return null;
      }
      
      const $ = cheerio.load(searchHtml);
      
      // Find the first matching app result
      const firstResult = $('.listWidget .appRow').first();
      if (firstResult.length === 0) {
        console.log(`APKMirror: No results found for ${packageName}`);
        return null;
      }
      
      // Extract app page URL
      const appLink = firstResult.find('.appRowTitle a').attr('href');
      if (!appLink) {
        console.log(`APKMirror: Could not find app link`);
        return null;
      }
      
      const appPageUrl = appLink.startsWith('http') ? appLink : `${this.baseUrl}${appLink}`;
      
      // Fetch app page
      const appHtml = await this.fetchHtml(appPageUrl);
      if (!appHtml) {
        console.log(`APKMirror: Could not fetch app page`);
        return null;
      }
      
      const app$ = cheerio.load(appHtml);
      
      // Extract metadata
      const displayName = app$('h1.post-title').text().trim() || packageName;
      const iconUrl = app$('.post-thumbnail img').attr('src') || '';
      const description = app$('.notes').first().text().trim() || 'No description available';
      
      // Find latest version
      const latestVersionLink = app$('.table-cell .downloadButton').first().attr('href');
      let downloadUrl = '';
      
      if (latestVersionLink) {
        const versionPageUrl = latestVersionLink.startsWith('http') 
          ? latestVersionLink 
          : `${this.baseUrl}${latestVersionLink}`;
        
        downloadUrl = await this.getDirectDownloadUrl(versionPageUrl);
      }
      
      console.log(`✅ APKMirror: Found ${displayName}`);
      
      return {
        packageName,
        displayName,
        shortDescription: description.substring(0, 200),
        fullDescription: description,
        iconUrl,
        versions: [
          {
            versionName: '1.0.0', // Would need to parse from page
            versionCode: 1,
            downloadUrl,
          },
        ],
      };
    } catch (error) {
      console.error(`APKMirror: Error fetching metadata for ${packageName}:`, error);
      return null;
    }
  }
  
  async getDownloadUrl(packageName: string): Promise<string | null> {
    try {
      console.log(`APKMirror: Getting download URL for ${packageName}...`);
      
      // Search for the app
      const searchUrl = `${this.baseUrl}/?s=${encodeURIComponent(packageName)}&post_type=app_release&searchtype=apk`;
      const searchHtml = await this.fetchHtml(searchUrl);
      
      if (!searchHtml) return null;
      
      const $ = cheerio.load(searchHtml);
      const firstResult = $('.listWidget .appRow').first();
      
      if (firstResult.length === 0) return null;
      
      const appLink = firstResult.find('.appRowTitle a').attr('href');
      if (!appLink) return null;
      
      const appPageUrl = appLink.startsWith('http') ? appLink : `${this.baseUrl}${appLink}`;
      const appHtml = await this.fetchHtml(appPageUrl);
      
      if (!appHtml) return null;
      
      const app$ = cheerio.load(appHtml);
      const latestVersionLink = app$('.table-cell .downloadButton').first().attr('href');
      
      if (!latestVersionLink) {
        console.log(`APKMirror: No download button found`);
        return null;
      }
      
      const versionPageUrl = latestVersionLink.startsWith('http') 
        ? latestVersionLink 
        : `${this.baseUrl}${latestVersionLink}`;
      
      return await this.getDirectDownloadUrl(versionPageUrl);
    } catch (error) {
      console.error(`APKMirror: Error getting download URL for ${packageName}:`, error);
      return null;
    }
  }
  
  /**
   * Gets the direct download URL from an APKMirror download page
   */
  private async getDirectDownloadUrl(downloadPageUrl: string): Promise<string> {
    try {
      const html = await this.fetchHtml(downloadPageUrl);
      if (!html) return '';
      
      const $ = cheerio.load(html);
      
      // APKMirror has a download button that leads to the actual download
      const downloadLink = $('a.downloadButton').attr('href');
      
      if (downloadLink) {
        const fullUrl = downloadLink.startsWith('http') 
          ? downloadLink 
          : `${this.baseUrl}${downloadLink}`;
        
        console.log(`✅ APKMirror: Found download URL`);
        return fullUrl;
      }
      
      console.log(`APKMirror: Could not find direct download link`);
      return '';
    } catch (error) {
      console.error(`APKMirror: Error getting direct download URL:`, error);
      return '';
    }
  }
}

