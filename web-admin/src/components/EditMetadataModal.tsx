'use client';

import { useState, useEffect } from 'react';
import { appsApi, type UpdateAppData, type App } from '@/lib/api';

interface EditMetadataModalProps {
  app: App;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditMetadataModal({ app, isOpen, onClose, onSuccess }: EditMetadataModalProps) {
  const [formData, setFormData] = useState<UpdateAppData>({
    display_name: app.display_name,
    short_description: app.short_description || '',
    icon_url: app.icon_url || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      display_name: app.display_name,
      short_description: app.short_description || '',
      icon_url: app.icon_url || '',
    });
  }, [app]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await appsApi.update(app.id, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Edit Metadata</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Display Name *</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Short Description</label>
            <textarea
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>

          {/* Icon URL */}
          <div>
            <label className="block text-sm font-medium mb-1">Icon URL</label>
            <input
              type="url"
              value={formData.icon_url}
              onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="https://example.com/icon.png"
            />
            {formData.icon_url && (
              <img 
                src={formData.icon_url} 
                alt="Preview" 
                className="mt-2 w-16 h-16 rounded"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

