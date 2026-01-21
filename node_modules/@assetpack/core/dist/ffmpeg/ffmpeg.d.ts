import fluentFfmpeg from 'fluent-ffmpeg';
import type { AssetPipe } from '../core/index.js';
type FfmpegKeys = 'inputFormat' | 'inputFPS' | 'native' | 'seekInput' | 'loop' | 'noAudio' | 'audioCodec' | 'audioBitrate' | 'audioChannels' | 'audioFrequency' | 'audioQuality' | 'noVideo' | 'videoCodec' | 'videoBitrate' | 'fps' | 'frames' | 'size' | 'aspect' | 'autopad' | 'keepDAR' | 'seek' | 'duration' | 'format' | 'flvmeta';
type FfmpegCommands = {
    [K in FfmpegKeys]: Parameters<fluentFfmpeg.FfmpegCommand[K]>[0] | undefined;
};
export interface FfmpegData {
    formats: string[];
    recompress: boolean;
    options: Partial<FfmpegCommands>;
}
export interface FfmpegOptions {
    name?: string;
    inputs: string[];
    outputs: FfmpegData[];
}
export declare function ffmpeg(defaultOptions: FfmpegOptions): AssetPipe<FfmpegOptions>;
export {};
