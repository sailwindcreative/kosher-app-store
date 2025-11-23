import type { SourceProvider, AppMetadata } from '../types/index.js';
import { validateSourceUrl } from '../utils/validation.js';
import fetch from 'node-fetch';

/**
 * Base class for source providers with common functionality
 */
export abstract class BaseSourceProvider implements SourceProvider {
  abstract name: string;
  abstract type: 'apkmirror' | 'apkpure' | 'custom';
  
  protected baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  abstract fetchMetadata(packageName: string): Promise<AppMetadata | null>;
  abstract getDownloadUrl(packageName: string, versionCode?: number): Promise<string | null>;
  
  /**
   * Verify a URL is valid and accessible
   */
  async verifyUrl(url: string): Promise<boolean> {
    if (!validateSourceUrl(url)) {
      return false;
    }
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 5000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  /**
   * Fetch HTML content from a URL
   */
  protected async fetchHtml(url: string): Promise<string | null> {
    if (!validateSourceUrl(url)) {
      throw new Error(`URL not in whitelist: ${url}`);
    }
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.text();
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch JSON from a URL
   */
  protected async fetchJson<T>(url: string): Promise<T | null> {
    if (!validateSourceUrl(url)) {
      throw new Error(`URL not in whitelist: ${url}`);
    }
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error(`Failed to fetch JSON from ${url}:`, error);
      return null;
    }
  }
}

