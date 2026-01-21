'use strict';

var instance = require('../instance.js');
var WebAudioUtils = require('../webaudio/WebAudioUtils.js');
var Filter = require('./Filter.js');

class StereoFilter extends Filter.Filter {
  /** @param pan - The amount of panning, -1 is left, 1 is right, 0 is centered. */
  constructor(pan = 0) {
    let stereo;
    let panner;
    let destination;
    if (!instance.getInstance().useLegacy) {
      const { audioContext } = instance.getInstance().context;
      if (audioContext.createStereoPanner) {
        stereo = audioContext.createStereoPanner();
        destination = stereo;
      } else {
        panner = audioContext.createPanner();
        panner.panningModel = "equalpower";
        destination = panner;
      }
    }
    super(destination);
    this._stereo = stereo;
    this._panner = panner;
    this.pan = pan;
  }
  /** Set the amount of panning, where -1 is left, 1 is right, and 0 is centered */
  set pan(value) {
    this._pan = value;
    if (this._stereo) {
      WebAudioUtils.WebAudioUtils.setParamValue(this._stereo.pan, value);
    } else if (this._panner) {
      this._panner.setPosition(value, 0, 1 - Math.abs(value));
    }
  }
  get pan() {
    return this._pan;
  }
  destroy() {
    super.destroy();
    this._stereo = null;
    this._panner = null;
  }
}

exports.StereoFilter = StereoFilter;
//# sourceMappingURL=StereoFilter.js.map
