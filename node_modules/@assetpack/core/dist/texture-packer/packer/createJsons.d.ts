import type { PixiPacker } from './packTextures.js';
export declare function createJsons(packer: PixiPacker, width: number, height: number, options: {
    textureName: string;
    resolution: number;
    textureFormat: 'png' | 'jpg';
    nameStyle: 'short' | 'relative';
    removeFileExtension: boolean;
    autodetectAnimations?: boolean;
}): {
    name: string;
    json: any;
}[];
