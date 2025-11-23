import { config } from '../config.js';
import { createReadStream } from 'fs';

/**
 * Validates that a URL comes from an allowed source domain
 */
export function validateSourceUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Must be HTTPS
    if (urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Check if domain is in whitelist
    const hostname = urlObj.hostname.toLowerCase();
    return config.security.allowedSourceDomains.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Validates APK file by checking magic bytes
 */
export async function validateApkFile(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const stream = createReadStream(filePath, { start: 0, end: 3 });
    const chunks: Buffer[] = [];
    
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      // APK files are ZIP files, which start with PK (0x504B)
      const isZip = buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4B;
      resolve(isZip);
    });
    stream.on('error', () => resolve(false));
  });
}

/**
 * Validates device ID format (UUID v4)
 */
export function validateDeviceId(deviceId: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(deviceId);
}

/**
 * Validates package name format
 */
export function validatePackageName(packageName: string): boolean {
  // Android package name pattern: contains at least one dot and valid characters
  const packageNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;
  return packageNameRegex.test(packageName);
}

/**
 * Extracts package name from Google Play URL
 */
export function extractPackageNameFromPlayUrl(playUrl: string): string | null {
  try {
    const url = new URL(playUrl);
    if (!url.hostname.includes('play.google.com')) {
      return null;
    }
    
    const idParam = url.searchParams.get('id');
    if (idParam && validatePackageName(idParam)) {
      return idParam;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Sanitizes filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

