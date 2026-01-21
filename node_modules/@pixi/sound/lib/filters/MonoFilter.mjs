import { getInstance } from '../instance.mjs';
import { Filter } from './Filter.mjs';

class MonoFilter extends Filter {
  constructor() {
    let merger;
    let splitter;
    if (!getInstance().useLegacy) {
      const { audioContext } = getInstance().context;
      splitter = audioContext.createChannelSplitter();
      merger = audioContext.createChannelMerger();
      merger.connect(splitter);
    }
    super(merger, splitter);
    this._merger = merger;
  }
  destroy() {
    this._merger?.disconnect();
    this._merger = null;
    super.destroy();
  }
}

export { MonoFilter };
//# sourceMappingURL=MonoFilter.mjs.map
