import { EventEmitter, Ticker } from 'pixi.js';

let id = 0;
const _HTMLAudioInstance = class extends EventEmitter {
  /** @param parent - Parent element */
  constructor(parent) {
    super();
    this.id = id++;
    this.init(parent);
  }
  /**
   * Set a property by name, this makes it easy to chain values
   * @param name - Name of the property to set
   * @param value - Value to set property to
   */
  set(name, value) {
    if (this[name] === void 0) {
      throw new Error(`Property with name ${name} does not exist.`);
    } else {
      switch (name) {
        case "speed":
          this.speed = value;
          break;
        case "volume":
          this.volume = value;
          break;
        case "paused":
          this.paused = value;
          break;
        case "loop":
          this.loop = value;
          break;
        case "muted":
          this.muted = value;
          break;
      }
    }
    return this;
  }
  /** The current playback progress from 0 to 1. */
  get progress() {
    const { currentTime } = this._source;
    return currentTime / this._duration;
  }
  /** Pauses the sound. */
  get paused() {
    return this._paused;
  }
  set paused(paused) {
    this._paused = paused;
    this.refreshPaused();
  }
  /**
   * Reference: http://stackoverflow.com/a/40370077
   * @private
   */
  _onPlay() {
    this._playing = true;
  }
  /**
   * Reference: http://stackoverflow.com/a/40370077
   * @private
   */
  _onPause() {
    this._playing = false;
  }
  /**
   * Initialize the instance.
   * @param {htmlaudio.HTMLAudioMedia} media - Same as constructor
   */
  init(media) {
    this._playing = false;
    this._duration = media.source.duration;
    const source = this._source = media.source.cloneNode(false);
    source.src = media.parent.url;
    source.onplay = this._onPlay.bind(this);
    source.onpause = this._onPause.bind(this);
    media.context.on("refresh", this.refresh, this);
    media.context.on("refreshPaused", this.refreshPaused, this);
    this._media = media;
  }
  /**
   * Stop the sound playing
   * @private
   */
  _internalStop() {
    if (this._source && this._playing) {
      this._source.onended = null;
      this._source.pause();
    }
  }
  /** Stop the sound playing */
  stop() {
    this._internalStop();
    if (this._source) {
      this.emit("stop");
    }
  }
  /** Set the instance speed from 0 to 1 */
  get speed() {
    return this._speed;
  }
  set speed(speed) {
    this._speed = speed;
    this.refresh();
  }
  /** Get the set the volume for this instance from 0 to 1 */
  get volume() {
    return this._volume;
  }
  set volume(volume) {
    this._volume = volume;
    this.refresh();
  }
  /** If the sound instance should loop playback */
  get loop() {
    return this._loop;
  }
  set loop(loop) {
    this._loop = loop;
    this.refresh();
  }
  /** `true` if the sound is muted */
  get muted() {
    return this._muted;
  }
  set muted(muted) {
    this._muted = muted;
    this.refresh();
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
  /** Call whenever the loop, speed or volume changes */
  refresh() {
    const global = this._media.context;
    const sound = this._media.parent;
    this._source.loop = this._loop || sound.loop;
    const globalVolume = global.volume * (global.muted ? 0 : 1);
    const soundVolume = sound.volume * (sound.muted ? 0 : 1);
    const instanceVolume = this._volume * (this._muted ? 0 : 1);
    this._source.volume = instanceVolume * globalVolume * soundVolume;
    this._source.playbackRate = this._speed * global.speed * sound.speed;
  }
  /** Handle changes in paused state, either globally or sound or instance */
  refreshPaused() {
    const global = this._media.context;
    const sound = this._media.parent;
    const pausedReal = this._paused || sound.paused || global.paused;
    if (pausedReal !== this._pausedReal) {
      this._pausedReal = pausedReal;
      if (pausedReal) {
        this._internalStop();
        this.emit("paused");
      } else {
        this.emit("resumed");
        this.play({
          start: this._source.currentTime,
          end: this._end,
          volume: this._volume,
          speed: this._speed,
          loop: this._loop
        });
      }
      this.emit("pause", pausedReal);
    }
  }
  /** Start playing the sound/ */
  play(options) {
    const { start, end, speed, loop, volume, muted } = options;
    if (end) {
      console.assert(end > start, "End time is before start time");
    }
    this._speed = speed;
    this._volume = volume;
    this._loop = !!loop;
    this._muted = muted;
    this.refresh();
    if (this.loop && end !== null) {
      console.warn('Looping not support when specifying an "end" time');
      this.loop = false;
    }
    this._start = start;
    this._end = end || this._duration;
    this._start = Math.max(0, this._start - _HTMLAudioInstance.PADDING);
    this._end = Math.min(this._end + _HTMLAudioInstance.PADDING, this._duration);
    this._source.onloadedmetadata = () => {
      if (this._source) {
        this._source.currentTime = start;
        this._source.onloadedmetadata = null;
        this.emit("progress", start / this._duration, this._duration);
        Ticker.shared.add(this._onUpdate, this);
      }
    };
    this._source.onended = this._onComplete.bind(this);
    this._source.play();
    this.emit("start");
  }
  /**
   * Handle time update on sound.
   * @private
   */
  _onUpdate() {
    this.emit("progress", this.progress, this._duration);
    if (this._source.currentTime >= this._end && !this._source.loop) {
      this._onComplete();
    }
  }
  /**
   * Callback when completed.
   * @private
   */
  _onComplete() {
    Ticker.shared.remove(this._onUpdate, this);
    this._internalStop();
    this.emit("progress", 1, this._duration);
    this.emit("end", this);
  }
  /** Don't use after this. */
  destroy() {
    Ticker.shared.remove(this._onUpdate, this);
    this.removeAllListeners();
    const source = this._source;
    if (source) {
      source.onended = null;
      source.onplay = null;
      source.onpause = null;
      this._internalStop();
    }
    this._source = null;
    this._speed = 1;
    this._volume = 1;
    this._loop = false;
    this._end = null;
    this._start = 0;
    this._duration = 0;
    this._playing = false;
    this._pausedReal = false;
    this._paused = false;
    this._muted = false;
    if (this._media) {
      this._media.context.off("refresh", this.refresh, this);
      this._media.context.off("refreshPaused", this.refreshPaused, this);
      this._media = null;
    }
  }
  /**
   * To string method for instance.
   * @return The string representation of instance.
   */
  toString() {
    return `[HTMLAudioInstance id=${this.id}]`;
  }
};
let HTMLAudioInstance = _HTMLAudioInstance;
/** Extra padding, in seconds, to deal with low-latecy of HTMLAudio. */
HTMLAudioInstance.PADDING = 0.1;

export { HTMLAudioInstance };
//# sourceMappingURL=HTMLAudioInstance.mjs.map
