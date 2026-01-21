import type { Asset, TransformStats } from './Asset.js';
export interface AssetCacheOptions {
    cacheName?: string;
}
/**
 * Interface representing the Asset Cache.
 * This interface defines the methods required for reading from and writing to the asset cache.
 */
export interface IAssetCache {
    /**
     * Reads the asset cache and returns a record of cached assets.
     * @returns {Record<string, CachedAsset>} A record containing the cached assets.
     */
    read(): Record<string, CachedAsset>;
    /**
     * Writes an asset to the cache. this is usually the root asset.
     * @param {Asset} asset - The asset to be written to the cache.
     */
    write(asset: Asset): void;
    /**
     * Checks if the asset cache exists.
     * @returns {boolean} Whether the asset cache exists.
     */
    exists(): boolean;
}
export declare class AssetCache implements IAssetCache {
    static location: string;
    private _assetCacheData;
    private _cacheName;
    constructor({ cacheName }?: AssetCacheOptions);
    exists(): boolean;
    read(): Record<string, CachedAsset>;
    write(asset: Asset): void;
    private _serializeAsset;
    private toCacheData;
}
export interface CachedAsset {
    isFolder: boolean;
    hash?: string;
    parent: string | undefined;
    metaData: Record<string, any>;
    inheritedMetaData: Record<string, any>;
    transformData: Record<string, any>;
    transformParent: string | undefined;
    stats: TransformStats | undefined;
}
