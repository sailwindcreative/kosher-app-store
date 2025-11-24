'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { appsApi, type AppDetail, type TestFetchResult } from '@/lib/api';
import EditMetadataModal from '@/components/EditMetadataModal';

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;
  
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testResults, setTestResults] = useState<TestFetchResult[] | null>(null);
  const [testing, setTesting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const loadApp = async () => {
    try {
      setLoading(true);
      const data = await appsApi.get(appId);
      setApp(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load app');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadApp();
  }, [appId]);
  
  const handleTestFetch = async () => {
    try {
      setTesting(true);
      const response = await appsApi.testFetch(appId);
      setTestResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test fetch failed');
    } finally {
      setTesting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading app details...</div>
      </div>
    );
  }
  
  if (error || !app) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        {error || 'App not found'}
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Apps
        </button>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Edit Metadata
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-4">
          {app.icon_url && (
            <img
              src={app.icon_url}
              alt={app.display_name}
              className="h-24 w-24 rounded-lg"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {app.display_name}
            </h1>
            <p className="text-gray-600 mb-2">{app.package_name}</p>
            <p className="text-sm text-gray-500">{app.short_description}</p>
          </div>
        </div>
        
        {app.full_description && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Full Description</h3>
            <p className="text-sm text-gray-600">{app.full_description}</p>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Current Version:</span>
              <span className="ml-2 font-medium">
                {app.current_version_name || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Version Code:</span>
              <span className="ml-2 font-medium">
                {app.current_version_code || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2 font-medium">
                {new Date(app.created_at).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Updated:</span>
              <span className="ml-2 font-medium">
                {new Date(app.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Versions</h2>
          <button
            onClick={handleTestFetch}
            disabled={testing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {testing ? 'Testing...' : 'Test Fetch'}
          </button>
        </div>
        
        {app.app_versions && app.app_versions.length > 0 ? (
          <div className="space-y-4">
            {app.app_versions.map((version) => (
              <div key={version.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{version.version_name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      (Code: {version.version_code})
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(version.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {version.app_source_versions && version.app_source_versions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-sm font-medium text-gray-700">Sources:</div>
                    {version.app_source_versions.map((sv) => (
                      <div key={sv.id} className="text-xs text-gray-600 flex items-center">
                        <span className="w-24">{sv.app_sources.name}</span>
                        <span className={`px-2 py-1 rounded ${
                          sv.last_status === 'ok' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {sv.last_status}
                        </span>
                        <span className="ml-2 truncate text-gray-400">
                          {sv.download_url}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No versions available</p>
        )}
        
        {testResults && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Test Results</h3>
            <div className="space-y-2">
              {testResults.map((result: any) => {
                const getStatusStyle = () => {
                  switch (result.status) {
                    case 'success':
                      return 'bg-green-50 border border-green-200';
                    case 'warning':
                      return 'bg-yellow-50 border border-yellow-200';
                    case 'info':
                      return 'bg-blue-50 border border-blue-200';
                    case 'failure':
                      return 'bg-red-50 border border-red-200';
                    default:
                      return 'bg-gray-50 border border-gray-200';
                  }
                };
                
                const getBadgeStyle = () => {
                  switch (result.status) {
                    case 'success':
                      return 'bg-green-200 text-green-900';
                    case 'warning':
                      return 'bg-yellow-200 text-yellow-900';
                    case 'info':
                      return 'bg-blue-200 text-blue-900';
                    case 'failure':
                      return 'bg-red-200 text-red-900';
                    default:
                      return 'bg-gray-200 text-gray-900';
                  }
                };
                
                return (
                  <div
                    key={result.source_id}
                    className={`p-3 rounded-lg text-sm ${getStatusStyle()}`}
                  >
                    <div className="font-medium">
                      {result.source_name}
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getBadgeStyle()}`}>
                        {result.status}
                      </span>
                    </div>
                    
                    {result.message && (
                      <div className="mt-1 text-xs font-medium text-gray-700">
                        {result.message}
                      </div>
                    )}
                    
                    {result.url && (
                      <div className="mt-1 text-xs text-gray-600 break-all">
                        <span className="font-semibold">URL:</span> {result.url}
                      </div>
                    )}
                    
                    {result.error && (
                      <div className="mt-1 text-xs text-gray-700">
                        {result.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Downloads</h2>
        {app.recent_events && app.recent_events.length > 0 ? (
          <div className="space-y-2">
            {app.recent_events.map((event) => (
              <div key={event.id} className="text-sm border-b border-gray-100 pb-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Device: <code className="text-xs bg-gray-100 px-1 rounded">
                      {event.device_id.slice(0, 8)}...
                    </code>
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    event.event_type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : event.event_type === 'failure'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {event.event_type}
                  </span>
                </div>
                {event.error_message && (
                  <div className="text-xs text-red-600 mt-1">
                    {event.error_message}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(event.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No download events yet</p>
        )}
      </div>
      
      {app && (
        <EditMetadataModal
          app={app}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={loadApp}
        />
      )}
    </div>
  );
}

