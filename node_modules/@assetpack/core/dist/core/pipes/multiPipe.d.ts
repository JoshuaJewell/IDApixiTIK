import type { AssetPipe } from './AssetPipe.js';
export interface MultiPipeOptions {
    pipes: AssetPipe[];
    name?: string;
}
export declare function multiPipe(options: MultiPipeOptions): AssetPipe<MultiPipeOptions>;
