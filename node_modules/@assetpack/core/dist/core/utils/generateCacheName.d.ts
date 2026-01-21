import type { AssetPackConfig } from '../config.js';
/**
 * Returns a unique name based on the hash generated from the config
 * this takes into account the following:
 * - pipes and their options,
 * - entry and output paths.
 * - assetSettings options
 * - ignore options
 *
 * @param options - The asset pack config
 * @returns - A unique name based on the hash generated from the config
 */
export declare function generateCacheName(options: AssetPackConfig): string;
