'use strict';

var pixi_js = require('pixi.js');
var Filterable = require('../Filterable.js');

class WebAudioContext extends Filterable.Filterable {
  constructor() {
    const win = window;
    const ctx = new WebAudioContext.AudioContext();
    const compressor = ctx.createDynamicsCompressor();
    const analyser = ctx.createAnalyser();
    analyser.connect(compressor);
    compressor.connect(ctx.destination);
    super(analyser, compressor);
    /** Set to false ignore suspending when window is blurred */
    this.autoPause = true;
    this._ctx = ctx;
    this._offlineCtx = new WebAudioContext.OfflineAudioContext(
      1,
      2,
      win.OfflineAudioContext ? Math.max(8e3, Math.min(96e3, ctx.sampleRate)) : 44100
    );
    this.compressor = compressor;
    this.analyser = analyser;
    this.events = new pixi_js.EventEmitter();
    this.volume = 1;
    this.speed = 1;
    this.muted = false;
    this.paused = false;
    this._locked = ctx.state === "suspended" && ("ontouchstart" in globalThis || "onclick" in globalThis);
    if (this._locked) {
      this._unlock();
      this._unlock = this._unlock.bind(this);
      document.addEventListener("mousedown", this._unlock, true);
      document.addEventListener("touchstart", this._unlock, true);
      document.addEventListener("touchend", this._unlock, true);
    }
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    globalThis.addEventListener("focus", this.onFocus);
    globalThis.addEventListener("blur", this.onBlur);
  }
  /** Handle mobile WebAudio context resume */
  onFocus() {
    if (!this.autoPause) {
      return;
    }
    const state = this._ctx.state;
    if (state === "suspended" || state === "interrupted" || !this._locked) {
      this.paused = this._pausedOnBlur;
      this.refreshPaused();
    }
  }
  /** Handle mobile WebAudio context suspend */
  onBlur() {
    if (!this.autoPause) {
      return;
    }
    if (!this._locked) {
      this._pausedOnBlur = this._paused;
      this.paused = true;
      this.refreshPaused();
    }
  }
  /**
   * Try to unlock audio on iOS. This is triggered from either WebAudio plugin setup (which will work if inside of
   * a `mousedown` or `touchend` event stack), or the first document touchend/mousedown event. If it fails (touchend
   * will fail if the user presses for too long, indicating a scroll event instead of a click event.
   *
   * Note that earlier versions of iOS supported `touchstart` for this, but iOS9 removed this functionality. Adding
   * a `touchstart` event to support older platforms may preclude a `mousedown` even from getting fired on iOS9, so we
   * stick with `mousedown` and `touchend`.
   */
  _unlock() {
    if (!this._locked) {
      return;
    }
    this.playEmptySound();
    if (this._ctx.state === "running") {
      document.removeEventListener("mousedown", this._unlock, true);
      document.removeEventListener("touchend", this._unlock, true);
      document.removeEventListener("touchstart", this._unlock, true);
      this._locked = false;
    }
  }
  /**
   * Plays an empty sound in the web audio context.  This is used to enable web audio on iOS devices, as they
   * require the first sound to be played inside of a user initiated event (touch/click).
   */
  playEmptySound() {
    const source = this._ctx.createBufferSource();
    source.buffer = this._ctx.createBuffer(1, 1, 22050);
    source.connect(this._ctx.destination);
    source.start(0, 0, 0);
    if (source.context.state === "suspended") {
      source.context.resume();
    }
  }
  /**
   * Get AudioContext class, if not supported returns `null`
   * @type {AudioContext}
   * @readonly
   */
  static get AudioContext() {
    const win = window;
    return win.AudioContext || win.webkitAudioContext || null;
  }
  /**
   * Get OfflineAudioContext class, if not supported returns `null`
   * @type {OfflineAudioContext}
   * @readonly
   */
  static get OfflineAudioContext() {
    const win = window;
    return win.OfflineAudioContext || win.webkitOfflineAudioContext || null;
  }
  /** Destroy this context. */
  destroy() {
    super.destroy();
    const ctx = this._ctx;
    if (typeof ctx.close !== "undefined") {
      ctx.close();
    }
    globalThis.removeEventListener("focus", this.onFocus);
    globalThis.removeEventListener("blur", this.onBlur);
    this.events.removeAllListeners();
    this.analyser.disconnect();
    this.compressor.disconnect();
    this.analyser = null;
    this.compressor = null;
    this.events = null;
    this._offlineCtx = null;
    this._ctx = null;
  }
  /**
   * The WebAudio API AudioContext object.
   * @readonly
   * @type {AudioContext}
   */
  get audioContext() {
    return this._ctx;
  }
  /**
   * The WebAudio API OfflineAudioContext object.
   * @readonly
   * @type {OfflineAudioContext}
   */
  get offlineContext() {
    return this._offlineCtx;
  }
  /**
   * Pauses all sounds, even though we handle this at the instance
   * level, we'll also pause the audioContext so that the
   * time used to compute progress isn't messed up.
   * @default false
   */
  set paused(paused) {
    if (paused && this._ctx.state === "running") {
      this._ctx.suspend();
    } else if (!paused && this._ctx.state === "suspended") {
      this._ctx.resume();
    }
    this._paused = paused;
  }
  get paused() {
    return this._paused;
  }
  /** Emit event when muted, volume or speed changes */
  refresh() {
    this.events.emit("refresh");
  }
  /** Emit event when muted, volume or speed changes */
  refreshPaused() {
    this.events.emit("refreshPaused");
  }
  /**
   * Toggles the muted state.
   * @return The current muted state.
   */
  toggleMute() {
    this.muted = !this.muted;
    this.refresh();
    return this.muted;
  }
  /**
   * Toggles the paused state.
   * @return The current muted state.
   */
  togglePause() {
    this.paused = !this.paused;
    this.refreshPaused();
    return this._paused;
  }
  /**
   * Decode the audio data
   * @param arrayBuffer - Buffer from loader
   * @param callback - When completed, error and audioBuffer are parameters.
   */
  decode(arrayBuffer, callback) {
    const handleError = (err) => {
      callback(new Error(err?.message || "Unable to decode file"));
    };
    const result = this._offlineCtx.decodeAudioData(
      arrayBuffer,
      (buffer) => {
        callback(null, buffer);
      },
      handleError
    );
    if (result) {
      result.catch(handleError);
    }
  }
}

exports.WebAudioContext = WebAudioContext;
//# sourceMappingURL=WebAudioContext.js.map
