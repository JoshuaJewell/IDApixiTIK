export interface AssetIgnoreOptions {
    ignore: string | string[];
    entryPath: string;
}
export declare class AssetIgnore {
    private _ignore;
    private _ignoreHash;
    private _entryPath;
    constructor(options: AssetIgnoreOptions);
    shouldIgnore(fullPath: string): boolean;
    shouldInclude(fullPath: string): boolean;
}
