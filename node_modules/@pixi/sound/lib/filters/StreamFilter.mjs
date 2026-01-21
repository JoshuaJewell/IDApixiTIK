import { getInstance } from '../instance.mjs';
import { Filter } from './Filter.mjs';

class StreamFilter extends Filter {
  constructor() {
    let destination;
    let source;
    if (!getInstance().useLegacy) {
      const { audioContext } = getInstance().context;
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

export { StreamFilter };
//# sourceMappingURL=StreamFilter.mjs.map
