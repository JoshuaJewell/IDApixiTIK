import { checkExt, createNewAssetAt, path, stripTags } from '../core/index.js';
import { fonts } from './fonts.js';
export function webfont() {
    return {
        folder: false,
        name: 'webfont',
        defaultOptions: null,
        tags: {
            wf: 'wf',
        },
        test(asset) {
            return asset.allMetaData[this.tags.wf] && checkExt(asset.path, '.otf', '.ttf', '.svg');
        },
        async transform(asset) {
            const ext = path.extname(asset.path);
            let buffer = null;
            switch (ext) {
                case '.otf':
                    buffer = fonts.otf.to.woff2(asset.path);
                    break;
                case '.ttf':
                    buffer = fonts.ttf.to.woff2(asset.path);
                    break;
                case '.svg':
                    buffer = fonts.svg.to.woff2(asset.path);
                    break;
                default:
                    throw new Error(`{AssetPack] Unsupported font type: ${ext}`);
            }
            const newFileName = asset.filename.replace(/\.(otf|ttf|svg)$/i, '.woff2');
            const newAsset = createNewAssetAt(asset, newFileName);
            newAsset.buffer = buffer;
            // set the family name to the filename if it doesn't exist
            asset.metaData.family ??= stripTags(path.trimExt(asset.filename));
            return [newAsset];
        },
    };
}
//# sourceMappingURL=webfont.js.map