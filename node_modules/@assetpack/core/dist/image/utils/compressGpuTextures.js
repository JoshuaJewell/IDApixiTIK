import { generateASTC as astc, generateBasis as basis, generateBC as bc, generateETC as etc } from 'gpu-tex-enc';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
export async function compressGpuTextures(image, options) {
    let compressed = [];
    if (!options.astc && !options.bc7 && !options.basis) {
        return compressed;
    }
    const tmpDir = await fs.mkdtemp(join(tmpdir(), 'assetpack-tex-'));
    try {
        const imagePath = join(tmpDir, `${crypto.randomUUID()}.png`);
        const sharpImage = image.sharpImage;
        const pngImage = image.format !== '.png'
            ? sharpImage.clone().png({ quality: 100, force: true }) // most texture generators only support PNG.
            : sharpImage.clone();
        await pngImage.toFile(imagePath);
        if (options.astc) {
            const astcOpts = typeof options.astc === 'boolean' ? {} : options.astc;
            compressed.push({
                format: '.astc.ktx',
                resolution: 1,
                image: astc(imagePath, astcOpts.blocksize, astcOpts.quality, astcOpts.colorProfile, astcOpts.options),
            });
        }
        if (options.bc7) {
            const bc7Opts = typeof options.bc7 === 'boolean' ? {} : options.bc7;
            compressed.push({
                format: '.bc7.dds',
                resolution: 1,
                image: bc(imagePath, 'BC7', true, bc7Opts.options),
            });
        }
        if (options.basis) {
            const basisOpts = typeof options.basis === 'boolean' ? {} : options.basis;
            const adjustedImagePath = await adjustImageSize(pngImage, imagePath);
            compressed.push({
                format: '.basis.ktx2',
                resolution: 1,
                image: basis(adjustedImagePath, 'UASTC', true, basisOpts.options),
            });
        }
        if (options.etc) {
            const etcOpts = typeof options.etc === 'boolean' ? {} : options.etc;
            compressed.push({
                format: '.etc.ktx',
                resolution: 1,
                image: etc(imagePath, 'RGBA8', etcOpts.effort, etcOpts.errormetric, etcOpts.options),
            });
        }
        const results = await Promise.all(compressed.map(async (result) => ({
            ...result,
            buffer: await fs.readFile(await result.image),
        })));
        compressed = results;
    }
    finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
    return compressed;
}
async function adjustImageSize(sharpImage, imagePath) {
    const metadata = await sharpImage.metadata();
    const { width = 0, height = 0 } = metadata;
    const right = width % 4 !== 0 ? 4 - (width % 4) : 0;
    const bottom = height % 4 !== 0 ? 4 - (height % 4) : 0;
    if (right > 0 || bottom > 0) {
        const adjustedImagePath = `${imagePath}.1${extname(imagePath)}`;
        await sharpImage
            .clone()
            .extend({
            bottom,
            right,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
            .toFile(adjustedImagePath);
        return adjustedImagePath;
    }
    return imagePath;
}
//# sourceMappingURL=compressGpuTextures.js.map