import fs from 'fs-extra';
import merge from 'merge';
import { AssetCache } from './AssetCache.js';
import { AssetWatcher } from './AssetWatcher.js';
import { BuildReporter } from './logger/BuildReporter.js';
import { finalCopyPipe } from './pipes/finalCopyPipe.js';
import { PipeSystem } from './pipes/PipeSystem.js';
import { generateCacheName } from './utils/generateCacheName.js';
import { path } from './utils/path.js';
import { promiseAllConcurrent } from './utils/promiseAllConcurrent.js';
export class AssetPack {
    _defaultConfig = {
        entry: './static',
        output: './dist',
        ignore: [],
        cache: true,
        cacheLocation: '.assetpack',
        logLevel: 'info',
        pipes: [],
        strict: false,
    };
    config;
    _pipeSystem;
    _assetWatcher;
    _entryPath = '';
    _outputPath = '';
    /**
     * Holds onto the optional onComplete callback passed in by the watch method
     * will be called after each time asset pack has finished transforming the assets
     */
    _onWatchTransformComplete;
    /**
     * Holds a promise resolve function that will be called after the first time
     * asset pack has finished transforming the assets when the watch method is called
     */
    _onWatchInitialTransformComplete;
    constructor(config = {}) {
        this.config = merge.recursive(true, this._defaultConfig, config);
        this._entryPath = normalizePath(this.config.entry);
        this._outputPath = normalizePath(this.config.output);
        BuildReporter.init({
            level: this.config.logLevel || 'info',
            strict: this.config.strict || false,
        });
        const { pipes, cache, cacheLocation } = this.config;
        AssetCache.location = cacheLocation;
        let assetCache;
        // if there is no cache, lets just go ahead and remove the output folder
        // and the cached info folder
        if (!cache) {
            fs.removeSync(this._outputPath);
            fs.removeSync(cacheLocation);
        }
        else {
            // create the asset cache, this is used to store the asset graph information
            // so if you restart the process, it can pick up where it left off
            assetCache = new AssetCache({
                cacheName: generateCacheName(this.config),
            });
            // read the cache data, this will be used to restore the asset graph
            // by the AssetWatcher
            if (assetCache.exists()) {
                BuildReporter.info('[AssetPack] cache found.');
            }
            else {
                BuildReporter.warn('[AssetPack] cache not found, clearing output folder');
                // to be safe - lets nuke the folder as the cache is empty
                fs.removeSync(this._outputPath);
            }
        }
        // make sure the output folders exists
        fs.ensureDirSync(this._outputPath);
        fs.ensureDirSync(cacheLocation);
        // create the pipe system, this is used to transform the assets
        // we add the finalCopyPipe to the end of the pipes array. This is a pipe
        // that will copy the final files to the output folder
        this._pipeSystem = new PipeSystem({
            outputPath: this._outputPath,
            entryPath: this._entryPath,
            pipes: [...pipes, finalCopyPipe],
        });
        // create the asset watcher, this is used to watch the file system for changes
        // it will also restore the asset graph from the cache data provided
        // onUpdate is called when the asset graph is updated / changed. Any assets that have
        // changed, will have a state marked as either 'added', 'modified' or 'deleted'
        // onComplete is called when onUpdate is finished, this is where you can do any cleanup
        // or final tasks - which for now is just writing the asset graph back to the cache
        // so it can be restored even if the process is terminated
        this._assetWatcher = new AssetWatcher({
            entryPath: this._entryPath,
            assetCache,
            ignore: this.config.ignore,
            assetSettingsData: this.config.assetSettings || [],
            onUpdate: async (root) => {
                BuildReporter.report({
                    type: 'buildProgress',
                    phase: 'transform',
                    message: '0',
                });
                await this._transform(root).catch((e) => {
                    BuildReporter.error(`[AssetPack] Transform failed: ${e.message}`);
                });
            },
            onComplete: async (root) => {
                if (cache) {
                    // write back to the cache...
                    assetCache.write(root);
                    root.releaseChildrenBuffers();
                    BuildReporter.info('cache updated.');
                }
                BuildReporter.report({
                    type: 'buildSuccess',
                });
                this._onWatchTransformComplete?.(root);
                // if the watch method was called, we need to resolve the promise
                // that was created when the watch method was called
                if (this._onWatchInitialTransformComplete) {
                    this._onWatchInitialTransformComplete(root);
                    // clear the promise resolve function, so it only gets resolved once
                    this._onWatchInitialTransformComplete = undefined;
                }
            },
        });
    }
    /**
     * Run the asset pack, this will transform all the assets and resolve when it's done
     */
    async run() {
        await this._assetWatcher.run();
    }
    /**
     * Watch the asset pack, this will watch the file system for changes and transform the assets.
     * you can enable this when in development mode
     *
     * @param onComplete - optional callback that will be called after each time asset pack has finished transforming the assets
     * @returns a promise that will resolve when the first time asset pack has finished transforming the assets
     */
    watch(onComplete) {
        this._onWatchTransformComplete = onComplete;
        const onCompletePromise = new Promise((resolve) => {
            this._onWatchInitialTransformComplete = resolve;
        });
        void this._assetWatcher.watch();
        return onCompletePromise;
    }
    /**
     * Stop the asset pack, this will stop the watcher
     */
    stop() {
        return this._assetWatcher.stop();
    }
    get rootAsset() {
        return this._assetWatcher.root;
    }
    async _transform(asset) {
        await this._pipeSystem.start(asset);
        const assetsToTransform = [];
        this.deleteAndCollectAssetsToTransform(asset, assetsToTransform);
        let index = 0;
        const all = assetsToTransform.map((asset) => async () => {
            if (asset.skip)
                return;
            const stats = (asset.stats = {
                date: Date.now(),
                duration: 0,
                success: true,
            });
            const now = performance.now();
            await this._pipeSystem.transform(asset).catch((e) => {
                stats.success = false;
                stats.error = e.message;
                BuildReporter.error(`[AssetPack] Transform failed:\ntransform: ${e.name}\nasset:${asset.path}\nerror:${e.message}`);
            });
            stats.duration = performance.now() - now;
            index++;
            const percent = Math.round((index / assetsToTransform.length) * 100);
            BuildReporter.report({
                type: 'buildProgress',
                phase: 'transform',
                message: percent.toString(),
            });
        });
        await promiseAllConcurrent(all, 5);
        await this._pipeSystem.finish(asset);
    }
    deleteAndCollectAssetsToTransform(asset, output) {
        if (asset.state !== 'normal') {
            if (asset.state === 'deleted') {
                void deleteAssetFiles(asset);
            }
            else {
                output.push(asset);
            }
            for (let i = 0; i < asset.children.length; i++) {
                this.deleteAndCollectAssetsToTransform(asset.children[i], output);
            }
        }
    }
}
export async function deleteAssetFiles(asset) {
    asset.transformChildren.forEach((child) => {
        _deleteAsset(child);
    });
}
function _deleteAsset(asset) {
    asset.transformChildren.forEach((child) => {
        _deleteAsset(child);
    });
    if (!asset.isFolder) {
        fs.removeSync(asset.path);
    }
}
function normalizePath(pth) {
    pth = path.normalizeTrim(pth);
    if (!path.isAbsolute(pth)) {
        pth = path.normalizeTrim(path.join(process.cwd(), pth));
    }
    return pth;
}
//# sourceMappingURL=AssetPack.js.map