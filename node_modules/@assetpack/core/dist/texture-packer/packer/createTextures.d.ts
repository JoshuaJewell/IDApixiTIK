import type { PackTexturesOptions, PixiPacker } from './packTextures.js';
export declare function createTextures(packer: PixiPacker, width: number, height: number, options: Required<PackTexturesOptions>): Promise<{
    name: string;
    buffer: Buffer;
}[]>;
export declare function createName(name: string, page: number, paginate: boolean, scale: number, format: string): string;
