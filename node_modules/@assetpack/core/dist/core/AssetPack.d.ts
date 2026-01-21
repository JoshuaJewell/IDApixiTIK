import type { Asset } from './Asset.js';
import type { AssetPackConfig } from './config.js';
export declare class AssetPack {
    private _defaultConfig;
    readonly config: AssetPackConfig;
    private _pipeSystem;
    private _assetWatcher;
    private _entryPath;
    private _outputPath;
    /**
     * Holds onto the optional onComplete callback passed in by the watch method
     * will be called after each time asset pack has finished transforming the assets
     */
    private _onWatchTransformComplete;
    /**
     * Holds a promise resolve function that will be called after the first time
     * asset pack has finished transforming the assets when the watch method is called
     */
    private _onWatchInitialTransformComplete;
    constructor(config?: AssetPackConfig);
    /**
     * Run the asset pack, this will transform all the assets and resolve when it's done
     */
    run(): Promise<void>;
    /**
     * Watch the asset pack, this will watch the file system for changes and transform the assets.
     * you can enable this when in development mode
     *
     * @param onComplete - optional callback that will be called after each time asset pack has finished transforming the assets
     * @returns a promise that will resolve when the first time asset pack has finished transforming the assets
     */
    watch(onComplete?: (root: Asset) => void): Promise<unknown>;
    /**
     * Stop the asset pack, this will stop the watcher
     */
    stop(): Promise<void>;
    get rootAsset(): Asset;
    private _transform;
    private deleteAndCollectAssetsToTransform;
}
export declare function deleteAssetFiles(asset: Asset): Promise<void>;
