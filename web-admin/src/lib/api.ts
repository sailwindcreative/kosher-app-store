const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || response.statusText);
  }
  
  return response.json();
}

// Apps API
export const appsApi = {
  list: () => fetchApi<App[]>('/api/admin/apps'),
  
  get: (id: string) => fetchApi<AppDetail>(`/api/admin/apps/${id}`),
  
  add: (data: { play_url?: string; package_name?: string }) =>
    fetchApi<App>('/api/admin/apps', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  quickAdd: (data: QuickAddData) =>
    fetchApi<App>('/api/admin/apps/quick', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: UpdateAppData) =>
    fetchApi<App>(`/api/admin/apps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  testFetch: (id: string) =>
    fetchApi<TestFetchResponse>(`/api/admin/apps/${id}/test-fetch`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};

// Sources API
export const sourcesApi = {
  list: () => fetchApi<Source[]>('/api/admin/sources'),
  
  get: (id: string) => fetchApi<Source>(`/api/admin/sources/${id}`),
  
  update: (id: string, data: Partial<Source>) =>
    fetchApi<Source>(`/api/admin/sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Type definitions
export interface App {
  id: string;
  package_name: string;
  display_name: string;
  short_description: string | null;
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
  app_source_versions?: AppSourceVersion[];
}

export interface AppSourceVersion {
  id: string;
  download_url: string;
  last_checked_at: string | null;
  last_status: string;
  app_sources: Source;
}

export interface Source {
  id: string;
  name: string;
  type: 'apkmirror' | 'apkpure' | 'custom';
  base_url: string;
  enabled: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface DownloadEvent {
  id: string;
  device_id: string;
  app_id: string;
  event_type: 'start' | 'success' | 'failure';
  error_message: string | null;
  created_at: string;
}

export interface AppDetail extends App {
  app_versions: AppVersion[];
  recent_events: DownloadEvent[];
}

export interface TestFetchResult {
  source_id: string;
  source_name: string;
  status: 'success' | 'failure' | 'warning' | 'info';
  url?: string;
  error?: string;
  message?: string;
  checked_at: string;
}

export interface TestFetchResponse {
  results: TestFetchResult[];
}

export interface QuickAddData {
  google_play_url?: string;
  apkmirror_url?: string;
  apkpure_url?: string;
  package_name?: string;
  display_name?: string;
  short_description?: string;
  icon_url?: string;
  use_mock_apk?: boolean;
}

export interface UpdateAppData {
  display_name?: string;
  short_description?: string;
  full_description?: string;
  icon_url?: string;
  current_version_name?: string;
  current_version_code?: number;
  play_url?: string;
}

