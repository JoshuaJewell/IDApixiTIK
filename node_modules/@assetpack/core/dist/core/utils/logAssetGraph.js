import { path } from './path.js';
const stateColorMap = {
    normal: 'white',
    added: 'green',
    modified: 'yellow',
    deleted: 'red',
};
const colors = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};
export function logAssetGraph(asset, indent = '') {
    // get file name..
    const baseName = path.basename(asset.path);
    log(`${indent}|- ${baseName}: ${asset.state}`, stateColorMap[asset.state]);
    indent += '  ';
    asset.children.forEach((child) => {
        logAssetGraph(child, indent);
    });
}
function log(...args) {
    // ]value: string, color: keyof typeof colors = 'white')
    const value = args.slice(0, -1).join(' ');
    const colorValue = args[args.length - 1] ?? 'white';
    // eslint-disable-next-line no-console
    console.log(colors[colorValue] || colors.white, value, '\x1b[0m');
}
//# sourceMappingURL=logAssetGraph.js.map