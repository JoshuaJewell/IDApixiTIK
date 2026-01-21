import { minimatch } from 'minimatch';
import { path } from './utils/path.js';
export class AssetIgnore {
    _ignore;
    _ignoreHash = {};
    _entryPath;
    constructor(options) {
        this._ignore = (Array.isArray(options.ignore) ? options.ignore : [options.ignore]);
        this._entryPath = options.entryPath;
    }
    shouldIgnore(fullPath) {
        const { _ignore, _ignoreHash } = this;
        if (_ignoreHash[fullPath] === undefined) {
            _ignoreHash[fullPath] = false;
            if (_ignore.length > 0) {
                const relativePath = path.relative(this._entryPath, fullPath);
                for (let i = 0; i < _ignore.length; i++) {
                    if (minimatch(relativePath, _ignore[i])) {
                        _ignoreHash[fullPath] = true;
                        break;
                    }
                }
            }
        }
        return _ignoreHash[fullPath];
    }
    shouldInclude(fullPath) {
        return !this.shouldIgnore(fullPath);
    }
}
//# sourceMappingURL=AssetIgnore.js.map