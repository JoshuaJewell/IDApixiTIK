import sharp from 'sharp';
import { checkExt, createNewAssetAt } from '../core/index.js';
import { compressGpuTextures } from './utils/compressGpuTextures.js';
import { compressSharp } from './utils/compressSharp.js';
import { resolveOptions } from './utils/resolveOptions.js';
export function compress(options = {}) {
    const compress = resolveOptions(options, {
        png: true,
        jpg: true,
        webp: true,
        avif: false,
        bc7: false,
        astc: false,
        basis: false,
        etc: false,
    });
    if (compress) {
        compress.jpg = resolveOptions(compress.jpg, {});
        compress.png = resolveOptions(compress.png, {
            quality: 90,
        });
        compress.webp = resolveOptions(compress.webp, {
            quality: 80,
            alphaQuality: 80,
        });
        compress.avif = resolveOptions(compress.avif, {});
        compress.bc7 = resolveOptions(compress.bc7, {});
        compress.astc = resolveOptions(compress.astc, {});
        compress.basis = resolveOptions(compress.basis, {});
        compress.etc = resolveOptions(compress.etc, {});
    }
    return {
        folder: true,
        name: 'compress',
        defaultOptions: {
            ...compress,
        },
        tags: {
            nc: 'nc',
        },
        test(asset, options) {
            return options && checkExt(asset.path, '.png', '.jpg', '.jpeg') && !asset.allMetaData[this.tags.nc];
        },
        async transform(asset, options) {
            const shouldCompress = compress && !asset.metaData[this.tags.nc];
            if (!shouldCompress) {
                return [];
            }
            try {
                const image = {
                    format: asset.extension,
                    resolution: 1,
                    sharpImage: sharp(asset.buffer),
                };
                const processedImages = [
                    ...(await compressSharp(image, options)),
                    ...(await compressGpuTextures(image, options)),
                ];
                const newAssets = processedImages.map((data) => {
                    const end = `${data.format}`;
                    const filename = asset.filename.replace(/\.[^/.]+$/, end);
                    const newAsset = createNewAssetAt(asset, filename);
                    newAsset.buffer = data.buffer;
                    return newAsset;
                });
                // ensure that the original image is passed through if it is not compressed by png/jpg options
                if ((image.format === '.png' && !options.png) ||
                    ((image.format === '.jpg' || image.format === '.jpeg') && !options.jpg)) {
                    newAssets.push(asset);
                }
                return newAssets;
            }
            catch (error) {
                throw new Error(`[AssetPack][compress] Failed to compress image: ${asset.path} - ${error}`);
            }
        },
    };
}
//# sourceMappingURL=compress.js.map