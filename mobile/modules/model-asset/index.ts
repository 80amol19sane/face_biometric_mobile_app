import { requireNativeModule } from 'expo';

interface ModelAssetNative {
  /** Copies a file from the app's native assets to app storage and returns its file:// URL. */
  materialize(name: string): Promise<string>;
}

export const ModelAsset = requireNativeModule<ModelAssetNative>('ModelAsset');
