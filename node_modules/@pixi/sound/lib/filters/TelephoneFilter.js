'use strict';

var instance = require('../instance.js');
var WebAudioUtils = require('../webaudio/WebAudioUtils.js');
var Filter = require('./Filter.js');

class TelephoneFilter extends Filter.Filter {
  constructor() {
    let destination;
    let source;
    if (!instance.getInstance().useLegacy) {
      const { audioContext } = instance.getInstance().context;
      const lpf1 = audioContext.createBiquadFilter();
      const lpf2 = audioContext.createBiquadFilter();
      const hpf1 = audioContext.createBiquadFilter();
      const hpf2 = audioContext.createBiquadFilter();
      lpf1.type = "lowpass";
      WebAudioUtils.WebAudioUtils.setParamValue(lpf1.frequency, 2e3);
      lpf2.type = "lowpass";
      WebAudioUtils.WebAudioUtils.setParamValue(lpf2.frequency, 2e3);
      hpf1.type = "highpass";
      WebAudioUtils.WebAudioUtils.setParamValue(hpf1.frequency, 500);
      hpf2.type = "highpass";
      WebAudioUtils.WebAudioUtils.setParamValue(hpf2.frequency, 500);
      lpf1.connect(lpf2);
      lpf2.connect(hpf1);
      hpf1.connect(hpf2);
      destination = lpf1;
      source = hpf2;
    }
    super(destination, source);
  }
}

exports.TelephoneFilter = TelephoneFilter;
//# sourceMappingURL=TelephoneFilter.js.map
