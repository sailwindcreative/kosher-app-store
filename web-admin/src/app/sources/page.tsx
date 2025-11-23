'use client';

import { useEffect, useState } from 'react';
import { sourcesApi, type Source } from '@/lib/api';

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  
  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await sourcesApi.list();
      setSources(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadSources();
  }, []);
  
  const handleToggleEnabled = async (source: Source) => {
    try {
      setUpdating(source.id);
      await sourcesApi.update(source.id, { enabled: !source.enabled });
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update source');
    } finally {
      setUpdating(null);
    }
  };
  
  const handlePriorityChange = async (source: Source, newPriority: number) => {
    try {
      setUpdating(source.id);
      await sourcesApi.update(source.id, { priority: newPriority });
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update source');
    } finally {
      setUpdating(null);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading sources...</div>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">APK Sources</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Base URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sources.map((source) => (
              <tr key={source.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {source.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                    {source.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a
                    href={source.base_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {source.base_url}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={source.priority}
                    onChange={(e) => handlePriorityChange(source, parseInt(e.target.value, 10))}
                    disabled={updating === source.id}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleEnabled(source)}
                    disabled={updating === source.id}
                    className={`px-3 py-1 text-sm font-medium rounded ${
                      source.enabled
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {source.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">About Sources</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Priority:</strong> Lower numbers = higher priority (checked first)</li>
          <li>• <strong>Enabled:</strong> Toggle to enable/disable a source</li>
          <li>• <strong>APKMirror & APKPure:</strong> Require scraping implementation (see backend README)</li>
          <li>• <strong>Custom Mirror:</strong> Implement your own APK server with the expected API</li>
        </ul>
      </div>
    </div>
  );
}

