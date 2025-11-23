import type { SourceProvider } from '../types/index.js';
import type { AppSource } from '../types/index.js';
import { APKMirrorProvider } from './apkmirror.js';
import { APKPureProvider } from './apkpure.js';
import { CustomMirrorProvider } from './custom.js';
import { PlayStoreProvider } from './playstore.js';

/**
 * Factory function to create source providers
 */
export function createSourceProvider(source: AppSource): SourceProvider {
  switch (source.type) {
    case 'apkmirror':
      return new APKMirrorProvider(source.base_url);
    case 'apkpure':
      return new APKPureProvider(source.base_url);
    case 'custom':
      return new CustomMirrorProvider(source.base_url);
    default:
      throw new Error(`Unknown source type: ${source.type}`);
  }
}

export { APKMirrorProvider, APKPureProvider, CustomMirrorProvider, PlayStoreProvider };

