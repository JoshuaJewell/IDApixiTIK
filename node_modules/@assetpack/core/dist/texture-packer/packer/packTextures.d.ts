import type { MaxRectsPacker, Rectangle } from 'maxrects-packer';
import type { SharpProcessingOptions } from '../../image/types.js';
export interface PixiRectData extends Rectangle {
    textureData: TextureData;
    path: string;
}
export type PixiPacker = MaxRectsPacker<PixiRectData>;
export type TexturePackerFormat = 'png' | 'jpg';
export interface TextureData {
    buffer: Buffer;
    originalWidth: number;
    originalHeight: number;
    width: number;
    height: number;
    trimOffsetLeft: number;
    trimOffsetTop: number;
    path: string;
    trimmed: boolean;
}
export interface PackTexturesOptions {
    texturesToPack: {
        path: string;
        contents: Buffer;
    }[];
    textureName: string;
    padding?: number;
    fixedSize?: boolean;
    powerOfTwo?: boolean;
    width?: number;
    height?: number;
    allowTrim?: boolean;
    allowRotation?: boolean;
    alphaThreshold?: number;
    textureFormat?: TexturePackerFormat;
    scale?: number;
    resolution?: number;
    nameStyle?: 'short' | 'relative';
    removeFileExtension?: boolean;
    autodetectAnimations?: boolean;
    sharpOptions?: SharpProcessingOptions;
}
interface PackTexturesResult {
    textures: {
        name: string;
        buffer: Buffer;
    }[];
    jsons: {
        name: string;
        json: any;
    }[];
}
export declare function packTextures(_options: PackTexturesOptions): Promise<PackTexturesResult>;
export {};
