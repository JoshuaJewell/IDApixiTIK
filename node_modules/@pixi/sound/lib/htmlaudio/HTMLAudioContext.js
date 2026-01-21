'use strict';

var pixi_js = require('pixi.js');

class HTMLAudioContext extends pixi_js.EventEmitter {
  constructor() {
    super(...arguments);
    /** Current global speed from 0 to 1 */
    this.speed = 1;
    /** Current muted status of the context */
    this.muted = false;
    /** Current volume from 0 to 1  */
    this.volume = 1;
    /** Current paused status */
    this.paused = false;
  }
  /** Internal trigger when volume, mute or speed changes */
  refresh() {
    this.emit("refresh");
  }
  /** Internal trigger paused changes */
  refreshPaused() {
    this.emit("refreshPaused");
  }
  /**
   * HTML Audio does not support filters, this is non-functional API.
   */
  get filters() {
    console.warn("HTML Audio does not support filters");
    return null;
  }
  set filters(_filters) {
    console.warn("HTML Audio does not support filters");
  }
  /**
   * HTML Audio does not support `audioContext`
   * @readonly
   * @type {AudioContext}
   */
  get audioContext() {
    console.warn("HTML Audio does not support audioContext");
    return null;
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
   * @return The current paused state.
   */
  togglePause() {
    this.paused = !this.paused;
    this.refreshPaused();
    return this.paused;
  }
  /** Destroy and don't use after this */
  destroy() {
    this.removeAllListeners();
  }
}

exports.HTMLAudioContext = HTMLAudioContext;
//# sourceMappingURL=HTMLAudioContext.js.map
