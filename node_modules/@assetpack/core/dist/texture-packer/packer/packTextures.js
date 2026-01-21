import { createJsons } from './createJsons.js';
import { createTextureData } from './createTextureData.js';
import { createTextures } from './createTextures.js';
import { fitTextureToPacker } from './fitTextureToPacker.js';
export async function packTextures(_options) {
    const options = {
        width: 1024,
        height: 1024,
        padding: 2,
        fixedSize: false,
        powerOfTwo: false,
        allowTrim: true,
        allowRotation: true,
        alphaThreshold: 0.1,
        textureFormat: 'png',
        scale: 1,
        resolution: 1,
        nameStyle: 'relative',
        removeFileExtension: false,
        autodetectAnimations: true,
        sharpOptions: {},
        ..._options,
    };
    options.width *= options.scale;
    options.height *= options.scale;
    // this reads all the textures, trims them and resize them.
    // next it creates a MaxRectsPacker, packs the textures, and returns the MaxRectsPacker
    // which now contains all the info we need to create the textures and jsons
    const packer = await createTextureData(options);
    const { width, height } = fitTextureToPacker(packer, options);
    return {
        // combine the textures into one big one with all the info we have
        textures: await createTextures(packer, width, height, options),
        // create the jsons for the textures
        jsons: createJsons(packer, width, height, options),
    };
}
//# sourceMappingURL=packTextures.js.map