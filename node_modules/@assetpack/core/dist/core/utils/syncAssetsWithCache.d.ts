import { Asset } from '../Asset.js';
import type { CachedAsset } from '../AssetCache.js';
export declare function syncAssetsWithCache(assetHash: Record<string, Asset>, cachedData: Record<string, CachedAsset>): void;
