export interface TransformStats {
    duration: number;
    date: number;
    success: boolean;
    error?: string;
}
export interface AssetOptions {
    path: string;
    transformName?: string;
    isFolder?: boolean;
}
export declare class Asset {
    private _defaultOptions;
    parent: Asset | null;
    children: Asset[];
    transformParent: Asset | null;
    transformChildren: Asset[];
    transformName: string | null;
    metaData: Record<string, any>;
    inheritedMetaData: Record<string, any>;
    transformData: Record<string, any>;
    settings?: Record<string, any>;
    isFolder: boolean;
    path: string;
    skip: boolean;
    stats?: TransformStats;
    private _state;
    private _buffer?;
    private _hash?;
    constructor(options: AssetOptions);
    addChild(asset: Asset): void;
    removeChild(asset: Asset): void;
    addTransformChild(asset: Asset): void;
    get allMetaData(): {
        [x: string]: any;
    };
    get state(): "deleted" | "added" | "modified" | "normal";
    set state(value: "deleted" | "added" | "modified" | "normal");
    get buffer(): Buffer;
    set buffer(value: Buffer | null);
    get hash(): string | undefined;
    get filename(): string;
    get directory(): string;
    get extension(): string;
    get rootAsset(): Asset;
    get rootTransformAsset(): Asset;
    skipChildren(): void;
    getFinalTransformedChildren(asset?: Asset, finalChildren?: Asset[]): Asset[];
    markParentAsModified(asset?: Asset): void;
    /**
     * Release all buffers from this asset and its transformed children
     * this is to make sure we don't hold onto buffers that are no longer needed!
     */
    releaseBuffers(): void;
    /**
     * Release all buffers from this asset and its children
     */
    releaseChildrenBuffers(): void;
    /**
     * Get the public meta data for this asset
     * This will exclude any internal data
     */
    getPublicMetaData(internalPipeData: Record<string, any>): Record<string, any>;
    getInternalMetaData(internalPipeData: Record<string, any>): Record<string, any>;
}
