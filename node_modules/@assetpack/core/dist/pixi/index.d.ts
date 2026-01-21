import type { AssetPipe } from '../core/index.js';
import type { FfmpegOptions } from '../ffmpeg/ffmpeg.js';
import type { CompressOptions } from '../image/compress.js';
import type { PixiManifestOptions } from '../manifest/pixiManifest.js';
import type { TexturePackerOptions } from '../texture-packer/texturePacker.js';
/**
 * Options for the AssetpackPlugin.
 */
export interface PixiAssetPack {
    cacheBust?: boolean;
    resolutions?: Record<string, number>;
    compression?: CompressOptions | false;
    texturePacker?: TexturePackerOptions;
    audio?: Partial<FfmpegOptions>;
    manifest?: PixiManifestOptions;
}
/**
 * Returns an array of plugins that can be used by AssetPack to process assets
 * for a PixiJS project.
 */
export declare function pixiPipes(config: PixiAssetPack): AssetPipe<Record<string, any>, string, string>[];
