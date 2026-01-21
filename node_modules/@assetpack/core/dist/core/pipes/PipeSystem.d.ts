import type { Asset } from '../Asset.js';
import type { AssetPipe, Tags } from './AssetPipe.js';
export interface PipeSystemOptions {
    pipes: (AssetPipe | AssetPipe[])[];
    outputPath: string;
    entryPath: string;
}
export interface AssetSettings {
    files: string[];
    settings?: Record<string, any>;
    metaData?: Record<Tags, boolean> | Record<string, any>;
}
export declare class PipeSystem {
    pipes: AssetPipe[];
    pipeHash: Record<string, AssetPipe>;
    outputPath: string;
    entryPath: string;
    assetSettings: AssetSettings[];
    internalMetaData: Record<string, any>;
    constructor(options: PipeSystemOptions);
    transform(asset: Asset): Promise<void>;
    private _transform;
    start(rootAsset: Asset): Promise<void>;
    finish(rootAsset: Asset): Promise<void>;
    getPipe(name: string): AssetPipe;
}
