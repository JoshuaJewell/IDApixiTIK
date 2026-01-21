import type { Asset } from '../Asset.js';
import type { AssetPipe, PluginOptions } from './AssetPipe.js';
export declare function mergePipeOptions<T extends PluginOptions>(pipe: AssetPipe<T>, asset: Asset): T | false;
