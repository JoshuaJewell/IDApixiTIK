import { minimatch } from 'minimatch';
import { merge } from './merge.js';
import { path } from './path.js';
export function applySettingToAsset(asset, settings, entryPath) {
    const relativePath = path.relative(entryPath, asset.path);
    let assetOptions;
    let metaData;
    for (let i = 0; i < settings.length; i++) {
        const setting = settings[i];
        const match = setting.files.some((item) => minimatch(relativePath, item, { dot: true }));
        if (match) {
            assetOptions = merge.recursive(true, assetOptions ?? {}, setting.settings);
            metaData = { ...(metaData ?? {}), ...setting.metaData };
        }
    }
    // if we have settings, then apply them to the asset
    if (assetOptions) {
        asset.settings = assetOptions;
        asset.metaData = { ...metaData, ...asset.metaData };
    }
}
//# sourceMappingURL=applySettingToAsset.js.map