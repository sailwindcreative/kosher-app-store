'use client';

import { useState } from 'react';
import { appsApi, type QuickAddData } from '@/lib/api';

interface QuickAddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickAddAppModal({ isOpen, onClose, onSuccess }: QuickAddAppModalProps) {
  const [formData, setFormData] = useState<QuickAddData>({
    google_play_url: '',
    apkmirror_url: '',
    apkpure_url: '',
    package_name: '',
    display_name: '',
    short_description: '',
    icon_url: '',
    use_mock_apk: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await appsApi.quickAdd(formData);
      onSuccess();
      setFormData({
        google_play_url: '',
        apkmirror_url: '',
        apkpure_url: '',
        package_name: '',
        display_name: '',
        short_description: '',
        icon_url: '',
        use_mock_apk: true,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Quick Add App</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Google Play URL */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Google Play URL <span className="text-green-600">(Recommended - Auto-fills metadata)</span>
            </label>
            <input
              type="url"
              value={formData.google_play_url}
              onChange={(e) => setFormData({ ...formData, google_play_url: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="https://play.google.com/store/apps/details?id=com.example.app"
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste a Google Play Store URL and we'll fetch the app details automatically
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Or enter manually:</p>
          </div>

          {/* Package Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Package Name</label>
            <input
              type="text"
              value={formData.package_name}
              onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="com.example.app"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Display Name (Optional)</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="My Awesome App"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Short Description (Optional)</label>
            <textarea
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={2}
              placeholder="A brief description of the app"
            />
          </div>

          {/* Icon URL */}
          <div>
            <label className="block text-sm font-medium mb-1">Icon URL (Optional)</label>
            <input
              type="url"
              value={formData.icon_url}
              onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="https://example.com/icon.png"
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">APK Download URLs (Optional):</p>
          </div>

          {/* APKMirror URL */}
          <div>
            <label className="block text-sm font-medium mb-1">APKMirror URL</label>
            <input
              type="url"
              value={formData.apkmirror_url}
              onChange={(e) => setFormData({ ...formData, apkmirror_url: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="https://www.apkmirror.com/..."
            />
          </div>

          {/* APKPure URL */}
          <div>
            <label className="block text-sm font-medium mb-1">APKPure URL</label>
            <input
              type="url"
              value={formData.apkpure_url}
              onChange={(e) => setFormData({ ...formData, apkpure_url: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="https://apkpure.com/..."
            />
          </div>

          {/* Use Mock APK */}
          <div className="flex items-center gap-2 bg-blue-50 p-3 rounded">
            <input
              type="checkbox"
              id="use_mock_apk"
              checked={formData.use_mock_apk}
              onChange={(e) => setFormData({ ...formData, use_mock_apk: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="use_mock_apk" className="text-sm">
              <strong>Create mock APK URLs</strong> (for testing - will generate placeholder download URLs)
            </label>
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
              {loading ? 'Adding...' : 'Add App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

