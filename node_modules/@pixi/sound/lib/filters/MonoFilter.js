'use strict';

var instance = require('../instance.js');
var Filter = require('./Filter.js');

class MonoFilter extends Filter.Filter {
  constructor() {
    let merger;
    let splitter;
    if (!instance.getInstance().useLegacy) {
      const { audioContext } = instance.getInstance().context;
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

exports.MonoFilter = MonoFilter;
//# sourceMappingURL=MonoFilter.js.map
