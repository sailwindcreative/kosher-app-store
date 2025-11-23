import crypto from 'crypto';
import { config } from '../config.js';
import type { DownloadToken } from '../types/index.js';

/**
 * Creates a signed download token
 */
export function createDownloadToken(payload: Omit<DownloadToken, 'expiresAt'>): string {
  const expiresAt = Date.now() + (config.security.downloadTokenExpirySeconds * 1000);
  const token: DownloadToken = { ...payload, expiresAt };
  
  const tokenString = JSON.stringify(token);
  const encoded = Buffer.from(tokenString).toString('base64url');
  
  const hmac = crypto.createHmac('sha256', config.security.apiSecret);
  hmac.update(encoded);
  const signature = hmac.digest('base64url');
  
  return `${encoded}.${signature}`;
}

/**
 * Verifies and decodes a download token
 */
export function verifyDownloadToken(token: string): DownloadToken | null {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) {
      return null;
    }
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', config.security.apiSecret);
    hmac.update(encoded);
    const expectedSignature = hmac.digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Decode payload
    const tokenString = Buffer.from(encoded, 'base64url').toString('utf-8');
    const payload = JSON.parse(tokenString) as DownloadToken;
    
    // Check expiry
    if (Date.now() > payload.expiresAt) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Computes SHA256 hash of a file
 */
export function computeSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

