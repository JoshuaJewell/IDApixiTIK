import { cacheBuster } from '../cache-buster/cacheBuster.js';
import { merge } from '../core/index.js';
import { audio } from '../ffmpeg/audio.js';
import { compress } from '../image/compress.js';
import { mipmap } from '../image/mipmap.js';
import { json } from '../json/index.js';
import { pixiManifest } from '../manifest/pixiManifest.js';
import { spineAtlasCacheBuster } from '../spine/spineAtlasCacheBuster.js';
import { spineAtlasCompress } from '../spine/spineAtlasCompress.js';
import { spineAtlasManifestMod } from '../spine/spineAtlasManifestMod.js';
import { spineAtlasMipmap } from '../spine/spineAtlasMipmap.js';
import { texturePacker } from '../texture-packer/texturePacker.js';
import { texturePackerCacheBuster } from '../texture-packer/texturePackerCacheBuster.js';
import { texturePackerCompress } from '../texture-packer/texturePackerCompress.js';
import { webfont } from '../webfont/webfont.js';
const resolutions = { default: 1, low: 0.5 };
/** the default config parts used by the Pixi pipes */
const defaultConfig = {
    cacheBust: true,
    resolutions,
    compression: {
        png: true,
        jpg: true,
        webp: true,
    },
    texturePacker: {
        texturePacker: {
            nameStyle: 'short',
        },
    },
    audio: {},
    manifest: { createShortcuts: true },
};
/**
 * Returns an array of plugins that can be used by AssetPack to process assets
 * for a PixiJS project.
 */
export function pixiPipes(config) {
    const apConfig = merge.recursive(defaultConfig, config);
    // don't merge the resolutions, just overwrite them
    apConfig.resolutions = config?.resolutions ?? apConfig.resolutions;
    const pipes = [
        webfont(),
        audio(apConfig.audio),
        texturePacker({
            ...apConfig.texturePacker,
            resolutionOptions: {
                ...apConfig.texturePacker?.resolutionOptions,
                resolutions: {
                    ...apConfig.resolutions,
                    ...apConfig.texturePacker?.resolutionOptions?.resolutions,
                },
            },
        }),
        mipmap({
            resolutions: apConfig.resolutions,
        }),
        spineAtlasMipmap({
            resolutions: apConfig.resolutions,
        }),
    ];
    if (apConfig.compression !== false) {
        pipes.push(compress(apConfig.compression), spineAtlasCompress(apConfig.compression), texturePackerCompress(apConfig.compression));
    }
    pipes.push(json());
    if (apConfig.cacheBust) {
        pipes.push(cacheBuster(), spineAtlasCacheBuster(), texturePackerCacheBuster());
    }
    const manifestOptions = {
        createShortcuts: true,
        ...apConfig.manifest,
    };
    pipes.push(pixiManifest(manifestOptions), spineAtlasManifestMod(manifestOptions));
    return pipes;
}
//# sourceMappingURL=index.js.map