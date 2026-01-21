import fluentFfmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import { checkExt, createNewAssetAt, path } from '../core/index.js';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
fluentFfmpeg.setFfmpegPath(ffmpegPath.path);
async function convert(ffmpegOptions, input, output, extension) {
    return new Promise(async (resolve, reject) => {
        let hasOutput = false;
        const command = fluentFfmpeg();
        await fs.ensureDir(path.dirname(output));
        // add each format to the command as an output
        ffmpegOptions.formats.forEach((format) => {
            if (ffmpegOptions.recompress || format !== extension) {
                command.output(output);
                hasOutput = true;
            }
            else {
                fs.copyFileSync(input, output);
            }
        });
        if (!hasOutput) {
            resolve();
            return;
        }
        // add the input file
        command.input(input);
        // add each option to the command
        Object.keys(ffmpegOptions.options).forEach((key) => {
            const value = ffmpegOptions.options[key];
            if (!command[key])
                throw new Error(`[ffmpeg] Unknown option: ${key}`);
            command[key](value);
        });
        // run the command
        command
            .on('error', reject)
            .on('end', (_stdout, _stderr) => resolve())
            .run();
    });
}
export function ffmpeg(defaultOptions) {
    return {
        folder: false,
        name: 'ffmpeg',
        defaultOptions,
        test(asset, options) {
            if (!options.inputs.length) {
                throw new Error('[ffmpeg] No inputs defined');
            }
            return checkExt(asset.path, ...options.inputs);
        },
        async transform(asset, options) {
            // merge options with defaults
            const extension = path.extname(asset.path);
            const baseFileName = asset.filename.replace(extension, '');
            const promises = [];
            const assets = [];
            options.outputs.forEach((output) => {
                const newFileName = `${baseFileName}${output.formats[0]}`;
                const newAsset = createNewAssetAt(asset, newFileName);
                promises.push(convert(output, asset.path, newAsset.path, extension));
                assets.push(newAsset);
            });
            await Promise.all(promises);
            return assets;
        },
    };
}
//# sourceMappingURL=ffmpeg.js.map