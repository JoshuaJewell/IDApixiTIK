import { MaxRectsPacker } from 'maxrects-packer';
import type { PackTexturesOptions, PixiRectData } from './packTextures.js';
/**
 * Creates texture data for packing by processing individual textures and setting up a MaxRects packer.
 *
 * This function processes a collection of textures by scaling, trimming (if enabled), and preparing
 * them for efficient packing into sprite sheets. It handles error cases by creating empty pixel
 * textures as fallbacks and calculates trim offsets for proper sprite positioning.
 */
export declare function createTextureData(options: Required<PackTexturesOptions>): Promise<MaxRectsPacker<PixiRectData>>;
