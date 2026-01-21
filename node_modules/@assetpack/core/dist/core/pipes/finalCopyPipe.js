import fs from 'fs-extra';
import { createNewAssetAt } from '../utils/createNewAssetAt.js';
export const finalCopyPipe = {
    name: 'final-copy',
    defaultOptions: {},
    test: (asset) => !asset.isFolder,
    transform: async (asset, _options, pipeSystem) => {
        const copiedAsset = createNewAssetAt(asset, asset.filename, pipeSystem.outputPath, true);
        copiedAsset.buffer = asset.buffer;
        fs.ensureDirSync(copiedAsset.directory);
        fs.writeFileSync(copiedAsset.path, copiedAsset.buffer);
        return [copiedAsset];
    },
};
//# sourceMappingURL=finalCopyPipe.js.map