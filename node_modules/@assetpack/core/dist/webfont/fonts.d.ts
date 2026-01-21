export declare const fonts: {
    ttf: {
        to: {
            woff2: (inFile: string | Buffer) => Buffer;
        };
    };
    svg: {
        to: {
            ttf: (inFile: string) => Buffer<ArrayBuffer>;
            woff2: (inFile: string) => Buffer<ArrayBufferLike>;
        };
    };
    otf: {
        to: {
            svg: (inFile: string) => string;
            ttf: (inFile: string) => Buffer<ArrayBuffer>;
            woff2: (inFile: string) => Buffer<ArrayBufferLike>;
        };
    };
};
