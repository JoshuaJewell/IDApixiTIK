export declare class AtlasView {
    rawAtlas: string;
    constructor(buffer: Buffer);
    getTextures(): string[];
    replaceTexture(filename: string, newFilename: string): void;
    get buffer(): Buffer<ArrayBuffer>;
}
