// Core type definitions for the backend

export interface App {
  id: string;
  package_name: string;
  play_url: string | null;
  display_name: string;
  short_description: string | null;
  full_description: string | null;
  icon_url: string | null;
  current_version_name: string | null;
  current_version_code: number | null;
  created_at: string;
  updated_at: string;
}

export interface AppVersion {
  id: string;
  app_id: string;
  version_name: string;
  version_code: number;
  checksum_sha256: string | null;
  created_at: string;
}

export interface AppSource {
  id: string;
  name: string;
  type: 'apkmirror' | 'apkpure' | 'custom';
  base_url: string;
  enabled: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AppSourceVersion {
  id: string;
  app_version_id: string;
  app_source_id: string;
  download_url: string;
  last_checked_at: string | null;
  last_status: string;
  created_at: string;
}

export interface Device {
  id: string;
  friendly_name: string | null;
  first_seen_at: string;
  last_seen_at: string;
  last_ip: string | null;
  created_at: string;
}

export interface Install {
  id: string;
  device_id: string;
  app_id: string;
  app_version_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DownloadEvent {
  id: string;
  device_id: string;
  app_id: string;
  app_version_id: string | null;
  app_source_id: string | null;
  event_type: 'start' | 'success' | 'failure';
  error_message: string | null;
  created_at: string;
}

// Source provider interfaces
export interface AppMetadata {
  packageName: string;
  displayName: string;
  shortDescription: string;
  fullDescription: string;
  iconUrl: string;
  playUrl?: string;
  versions: VersionMetadata[];
}

export interface VersionMetadata {
  versionName: string;
  versionCode: number;
  downloadUrl: string;
}

export interface SourceProvider {
  name: string;
  type: 'apkmirror' | 'apkpure' | 'custom';
  
  /**
   * Fetch app metadata and available versions from this source
   */
  fetchMetadata(packageName: string): Promise<AppMetadata | null>;
  
  /**
   * Get direct download URL for a specific version
   */
  getDownloadUrl(packageName: string, versionCode?: number): Promise<string | null>;
  
  /**
   * Verify a download URL is still valid (HEAD request)
   */
  verifyUrl(url: string): Promise<boolean>;
}

// Download token payload
export interface DownloadToken {
  deviceId: string;
  appId: string;
  appVersionId: string;
  appSourceId: string;
  expiresAt: number;
}

// API request/response types
export interface RegisterDeviceRequest {
  device_id: string;
  app_version: string;
}

export interface DownloadRequest {
  device_id: string;
}

export interface DownloadResponse {
  download_url: string;
}

export interface AddAppRequest {
  play_url?: string;
  package_name?: string;
}

export interface TestFetchResult {
  source_id: string;
  source_name: string;
  status: 'success' | 'failure';
  url?: string;
  error?: string;
  checked_at: string;
}

