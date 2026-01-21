import { merge } from 'merge';
import { ffmpeg } from './ffmpeg.js';
export function audio(_options) {
    // default settings for converting mp3, ogg, wav to mp3, ogg
    const defaultOptions = {
        name: 'audio',
        inputs: ['.mp3', '.ogg', '.wav'],
        outputs: [
            {
                formats: ['.mp3'],
                recompress: false,
                options: {
                    audioBitrate: 96,
                    audioChannels: 1,
                    audioFrequency: 48000,
                },
            },
            {
                formats: ['.ogg'],
                recompress: false,
                options: {
                    audioBitrate: 32,
                    audioChannels: 1,
                    audioFrequency: 22050,
                },
            },
        ],
    };
    const audio = ffmpeg(merge(true, defaultOptions, _options));
    audio.name = 'audio';
    return audio;
}
//# sourceMappingURL=audio.js.map