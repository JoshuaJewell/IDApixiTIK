import type { Asset } from '../Asset.js';
export declare function findAssets(test: (asset: Asset) => boolean, asset: Asset, searchTransform: boolean, out?: Asset[]): Asset[];
