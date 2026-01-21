'use strict';

var pixi_js = require('pixi.js');
var HTMLAudioInstance = require('./HTMLAudioInstance.js');

class HTMLAudioMedia extends pixi_js.EventEmitter {
  init(parent) {
    this.parent = parent;
    this._source = parent.options.source || new Audio();
    if (parent.url) {
      this._source.src = parent.url;
    }
  }
  // Implement create
  create() {
    return new HTMLAudioInstance.HTMLAudioInstance(this);
  }
  /**
   * If the audio media is playable (ready).
   * @readonly
   */
  get isPlayable() {
    return !!this._source && this._source.readyState === 4;
  }
  /**
   * THe duration of the media in seconds.
   * @readonly
   */
  get duration() {
    return this._source.duration;
  }
  /**
   * Reference to the context.
   * @readonly
   */
  get context() {
    return this.parent.context;
  }
  /** The collection of filters, does not apply to HTML Audio. */
  get filters() {
    return null;
  }
  set filters(_filters) {
    console.warn("HTML Audio does not support filters");
  }
  // Override the destroy
  destroy() {
    this.removeAllListeners();
    this.parent = null;
    if (this._source) {
      this._source.src = "";
      this._source.load();
      this._source = null;
    }
  }
  /**
   * Get the audio source element.
   * @type {HTMLAudioElement}
   * @readonly
   */
  get source() {
    return this._source;
  }
  // Implement the method to being preloading
  load(callback) {
    const source = this._source;
    const sound = this.parent;
    if (source.readyState === 4) {
      sound.isLoaded = true;
      const instance = sound.autoPlayStart();
      if (callback) {
        setTimeout(() => {
          callback(null, sound, instance);
        }, 0);
      }
      return;
    }
    if (!sound.url) {
      callback(new Error("sound.url or sound.source must be set"));
      return;
    }
    source.src = sound.url;
    const onLoad = () => {
      removeListeners();
      sound.isLoaded = true;
      const instance = sound.autoPlayStart();
      if (callback) {
        callback(null, sound, instance);
      }
    };
    const onAbort = () => {
      removeListeners();
      if (callback) {
        callback(new Error("Sound loading has been aborted"));
      }
    };
    const onError = () => {
      removeListeners();
      const message = `Failed to load audio element (code: ${source.error.code})`;
      if (callback) {
        callback(new Error(message));
      } else {
        console.error(message);
      }
    };
    const removeListeners = () => {
      source.removeEventListener("canplaythrough", onLoad);
      source.removeEventListener("load", onLoad);
      source.removeEventListener("abort", onAbort);
      source.removeEventListener("error", onError);
    };
    source.addEventListener("canplaythrough", onLoad, false);
    source.addEventListener("load", onLoad, false);
    source.addEventListener("abort", onAbort, false);
    source.addEventListener("error", onError, false);
    source.load();
  }
}

exports.HTMLAudioMedia = HTMLAudioMedia;
//# sourceMappingURL=HTMLAudioMedia.js.map
