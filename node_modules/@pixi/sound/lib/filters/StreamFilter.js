'use strict';

var instance = require('../instance.js');
var Filter = require('./Filter.js');

class StreamFilter extends Filter.Filter {
  constructor() {
    let destination;
    let source;
    if (!instance.getInstance().useLegacy) {
      const { audioContext } = instance.getInstance().context;
      destination = audioContext.createMediaStreamDestination();
      source = audioContext.createMediaStreamSource(destination.stream);
    }
    super(destination, source);
    this._stream = destination?.stream;
  }
  get stream() {
    return this._stream;
  }
  destroy() {
    this._stream = null;
    super.destroy();
  }
}

exports.StreamFilter = StreamFilter;
//# sourceMappingURL=StreamFilter.js.map
