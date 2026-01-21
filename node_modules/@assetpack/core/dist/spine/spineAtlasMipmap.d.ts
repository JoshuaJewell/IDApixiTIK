import type { AssetPipe, PluginOptions } from '../core/index.js';
import type { MipmapOptions } from '../image/index.js';
export type SpineOptions = PluginOptions & MipmapOptions;
export type SpineAtlasMipmapTags = 'fix' | 'nomip';
export declare function spineAtlasMipmap(_options?: SpineOptions): AssetPipe<SpineOptions, SpineAtlasMipmapTags>;
