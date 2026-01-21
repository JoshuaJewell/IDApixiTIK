import json5 from 'json5';
import { BuildReporter, checkExt, createNewAssetAt } from '../core/index.js';
export function json() {
    return {
        name: 'json',
        folder: false,
        defaultOptions: null,
        tags: {
            nc: 'nc',
        },
        test(asset) {
            return !asset.metaData[this.tags.nc] && checkExt(asset.path, '.json', '.json5');
        },
        async transform(asset) {
            try {
                const json = json5.parse(asset.buffer.toString());
                // replace the json5 with json
                const filename = asset.filename.replace('.json5', '.json');
                const compressedJsonAsset = createNewAssetAt(asset, filename);
                compressedJsonAsset.buffer = Buffer.from(JSON.stringify(json));
                return [compressedJsonAsset];
            }
            catch (_e) {
                BuildReporter.error(`[AssetPack][json] Failed to compress json file: ${asset.path}`);
                return [asset];
            }
        },
    };
}
//# sourceMappingURL=index.js.map