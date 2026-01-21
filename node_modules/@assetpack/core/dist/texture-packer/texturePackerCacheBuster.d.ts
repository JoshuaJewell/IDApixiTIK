import type { AssetPipe } from '../core/index.js';
export type TexturePackerCacheBusterTags = 'tps';
/**
 * This should be used after the cache buster plugin in the pipes.
 * As it relies on the cache buster plugin to have already cache busted all files.
 * This corrects the sprite sheet files to point to the new cache busted textures.
 * At the same time it updates the hash of the files.
 *
 * As this pipe needs to know about all the textures in the texture files most of the work is done
 * in the finish method.
 *
 * Kind of like applying a patch at the end of the transform process.
 *
 * @returns
 */
export declare function texturePackerCacheBuster(): AssetPipe<any, TexturePackerCacheBusterTags>;
