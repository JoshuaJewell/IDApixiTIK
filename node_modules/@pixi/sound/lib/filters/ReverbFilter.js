'use strict';

var instance = require('../instance.js');
var Filter = require('./Filter.js');

class ReverbFilter extends Filter.Filter {
  /**
   * @param seconds - Seconds for reverb
   * @param decay - The decay length
   * @param reverse - Reverse reverb
   */
  constructor(seconds = 3, decay = 2, reverse = false) {
    super(null);
    this._seconds = this._clamp(seconds, 1, 50);
    this._decay = this._clamp(decay, 0, 100);
    this._reverse = reverse;
    this._rebuild();
  }
  /**
   * Clamp a value
   * @param value
   * @param min - Minimum value
   * @param max - Maximum value
   * @return Clamped number
   */
  _clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  /**
   * Length of reverb in seconds from 1 to 50
   * @default 3
   */
  get seconds() {
    return this._seconds;
  }
  set seconds(seconds) {
    this._seconds = this._clamp(seconds, 1, 50);
    this._rebuild();
  }
  /**
   * Decay value from 0 to 100
   * @default 2
   */
  get decay() {
    return this._decay;
  }
  set decay(decay) {
    this._decay = this._clamp(decay, 0, 100);
    this._rebuild();
  }
  /**
   * Reverse value from 0 to 1
   * @default false
   */
  get reverse() {
    return this._reverse;
  }
  set reverse(reverse) {
    this._reverse = reverse;
    this._rebuild();
  }
  /**
   * Utility function for building an impulse response
   * from the module parameters.
   */
  _rebuild() {
    if (instance.getInstance().useLegacy) {
      return;
    }
    const { audioContext } = instance.getInstance().context;
    const rate = audioContext.sampleRate;
    const length = rate * this._seconds;
    const impulse = audioContext.createBuffer(2, length, rate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);
    let n;
    for (let i = 0; i < length; i++) {
      n = this._reverse ? length - i : i;
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, this._decay);
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, this._decay);
    }
    const convolver = audioContext.createConvolver();
    convolver.buffer = impulse;
    this.init(convolver);
  }
}

exports.ReverbFilter = ReverbFilter;
//# sourceMappingURL=ReverbFilter.js.map
