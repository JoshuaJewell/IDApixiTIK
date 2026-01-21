export function findAssets(test, asset, searchTransform, out = []) {
    if (test(asset)) {
        out.push(asset);
    }
    for (let i = 0; i < asset.children.length; i++) {
        const child = asset.children[i];
        findAssets(test, child, searchTransform, out);
    }
    for (let i = 0; i < asset.transformChildren.length; i++) {
        const transformChild = asset.transformChildren[i];
        findAssets(test, transformChild, searchTransform, out);
    }
    return out;
}
//# sourceMappingURL=findAssets.js.map