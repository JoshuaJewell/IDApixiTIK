import type { AssetPipe, PluginOptions } from '../core/index.js';
import type { SharpProcessingOptions } from './types.js';
export interface MipmapOptions extends PluginOptions {
    /** A template for denoting the resolution of the images. */
    template?: string;
    /** An object containing the resolutions that the images will be resized to. */
    resolutions?: {
        [x: string]: number;
    };
    /** A resolution used if the fixed tag is applied. Resolution must match one found in resolutions. */
    fixedResolution?: string;
    /** Options to pass to sharp for processing the images. */
    sharpOptions?: SharpProcessingOptions;
}
export type MipmapTags = 'fix' | 'nomip';
export declare function mipmap(defaultOptions?: MipmapOptions): AssetPipe<MipmapOptions, MipmapTags>;
