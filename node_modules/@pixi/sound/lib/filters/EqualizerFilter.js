'use strict';

var instance = require('../instance.js');
var WebAudioUtils = require('../webaudio/WebAudioUtils.js');
var Filter = require('./Filter.js');

const _EqualizerFilter = class extends Filter.Filter {
  /**
   * @param f32 - Default gain for 32 Hz
   * @param f64 - Default gain for 64 Hz
   * @param f125 - Default gain for 125 Hz
   * @param f250 - Default gain for 250 Hz
   * @param f500 - Default gain for 500 Hz
   * @param f1k - Default gain for 1000 Hz
   * @param f2k - Default gain for 2000 Hz
   * @param f4k - Default gain for 4000 Hz
   * @param f8k - Default gain for 8000 Hz
   * @param f16k - Default gain for 16000 Hz
   */
  constructor(f32 = 0, f64 = 0, f125 = 0, f250 = 0, f500 = 0, f1k = 0, f2k = 0, f4k = 0, f8k = 0, f16k = 0) {
    let bands = [];
    const equalizerBands = [
      {
        f: _EqualizerFilter.F32,
        type: "lowshelf",
        gain: f32
      },
      {
        f: _EqualizerFilter.F64,
        type: "peaking",
        gain: f64
      },
      {
        f: _EqualizerFilter.F125,
        type: "peaking",
        gain: f125
      },
      {
        f: _EqualizerFilter.F250,
        type: "peaking",
        gain: f250
      },
      {
        f: _EqualizerFilter.F500,
        type: "peaking",
        gain: f500
      },
      {
        f: _EqualizerFilter.F1K,
        type: "peaking",
        gain: f1k
      },
      {
        f: _EqualizerFilter.F2K,
        type: "peaking",
        gain: f2k
      },
      {
        f: _EqualizerFilter.F4K,
        type: "peaking",
        gain: f4k
      },
      {
        f: _EqualizerFilter.F8K,
        type: "peaking",
        gain: f8k
      },
      {
        f: _EqualizerFilter.F16K,
        type: "highshelf",
        gain: f16k
      }
    ];
    if (!instance.getInstance().useLegacy) {
      bands = equalizerBands.map((band) => {
        const node = instance.getInstance().context.audioContext.createBiquadFilter();
        node.type = band.type;
        WebAudioUtils.WebAudioUtils.setParamValue(node.Q, 1);
        node.frequency.value = band.f;
        WebAudioUtils.WebAudioUtils.setParamValue(node.gain, band.gain);
        return node;
      });
    }
    super(bands[0], bands[bands.length - 1]);
    this.bands = bands;
    this.bandsMap = {};
    for (let i = 0; i < this.bands.length; i++) {
      const node = this.bands[i];
      if (i > 0) {
        this.bands[i - 1].connect(node);
      }
      this.bandsMap[node.frequency.value] = node;
    }
  }
  /**
   * Set gain on a specific frequency.
   * @param frequency - The frequency, see EqualizerFilter.F* for bands
   * @param gain - Recommended -40 to 40.
   */
  setGain(frequency, gain = 0) {
    if (!this.bandsMap[frequency]) {
      throw new Error(`No band found for frequency ${frequency}`);
    }
    WebAudioUtils.WebAudioUtils.setParamValue(this.bandsMap[frequency].gain, gain);
  }
  /**
   * Get gain amount on a specific frequency.
   * @return The amount of gain set.
   */
  getGain(frequency) {
    if (!this.bandsMap[frequency]) {
      throw new Error(`No band found for frequency ${frequency}`);
    }
    return this.bandsMap[frequency].gain.value;
  }
  /**
   * Gain at 32 Hz frequencey.
   * @default 0
   */
  set f32(value) {
    this.setGain(_EqualizerFilter.F32, value);
  }
  get f32() {
    return this.getGain(_EqualizerFilter.F32);
  }
  /**
   * Gain at 64 Hz frequencey.
   * @default 0
   */
  set f64(value) {
    this.setGain(_EqualizerFilter.F64, value);
  }
  get f64() {
    return this.getGain(_EqualizerFilter.F64);
  }
  /**
   * Gain at 125 Hz frequencey.
   * @default 0
   */
  set f125(value) {
    this.setGain(_EqualizerFilter.F125, value);
  }
  get f125() {
    return this.getGain(_EqualizerFilter.F125);
  }
  /**
   * Gain at 250 Hz frequencey.
   * @default 0
   */
  set f250(value) {
    this.setGain(_EqualizerFilter.F250, value);
  }
  get f250() {
    return this.getGain(_EqualizerFilter.F250);
  }
  /**
   * Gain at 500 Hz frequencey.
   * @default 0
   */
  set f500(value) {
    this.setGain(_EqualizerFilter.F500, value);
  }
  get f500() {
    return this.getGain(_EqualizerFilter.F500);
  }
  /**
   * Gain at 1 KHz frequencey.
   * @default 0
   */
  set f1k(value) {
    this.setGain(_EqualizerFilter.F1K, value);
  }
  get f1k() {
    return this.getGain(_EqualizerFilter.F1K);
  }
  /**
   * Gain at 2 KHz frequencey.
   * @default 0
   */
  set f2k(value) {
    this.setGain(_EqualizerFilter.F2K, value);
  }
  get f2k() {
    return this.getGain(_EqualizerFilter.F2K);
  }
  /**
   * Gain at 4 KHz frequencey.
   * @default 0
   */
  set f4k(value) {
    this.setGain(_EqualizerFilter.F4K, value);
  }
  get f4k() {
    return this.getGain(_EqualizerFilter.F4K);
  }
  /**
   * Gain at 8 KHz frequencey.
   * @default 0
   */
  set f8k(value) {
    this.setGain(_EqualizerFilter.F8K, value);
  }
  get f8k() {
    return this.getGain(_EqualizerFilter.F8K);
  }
  /**
   * Gain at 16 KHz frequencey.
   * @default 0
   */
  set f16k(value) {
    this.setGain(_EqualizerFilter.F16K, value);
  }
  get f16k() {
    return this.getGain(_EqualizerFilter.F16K);
  }
  /** Reset all frequency bands to have gain of 0 */
  reset() {
    this.bands.forEach((band) => {
      WebAudioUtils.WebAudioUtils.setParamValue(band.gain, 0);
    });
  }
  destroy() {
    this.bands.forEach((band) => {
      band.disconnect();
    });
    this.bands = null;
    this.bandsMap = null;
  }
};
let EqualizerFilter = _EqualizerFilter;
/**
 * Band at 32 Hz
 * @readonly
 */
EqualizerFilter.F32 = 32;
/**
 * Band at 64 Hz
 * @readonly
 */
EqualizerFilter.F64 = 64;
/**
 * Band at 125 Hz
 * @readonly
 */
EqualizerFilter.F125 = 125;
/**
 * Band at 250 Hz
 * @readonly
 */
EqualizerFilter.F250 = 250;
/**
 * Band at 500 Hz
 * @readonly
 */
EqualizerFilter.F500 = 500;
/**
 * Band at 1000 Hz
 * @readonly
 */
EqualizerFilter.F1K = 1e3;
/**
 * Band at 2000 Hz
 * @readonly
 */
EqualizerFilter.F2K = 2e3;
/**
 * Band at 4000 Hz
 * @readonly
 */
EqualizerFilter.F4K = 4e3;
/**
 * Band at 8000 Hz
 * @readonly
 */
EqualizerFilter.F8K = 8e3;
/**
 * Band at 16000 Hz
 * @readonly
 */
EqualizerFilter.F16K = 16e3;

exports.EqualizerFilter = EqualizerFilter;
//# sourceMappingURL=EqualizerFilter.js.map
