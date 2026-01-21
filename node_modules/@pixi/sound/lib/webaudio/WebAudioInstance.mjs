import { EventEmitter, Ticker } from 'pixi.js';
import { WebAudioUtils } from './WebAudioUtils.mjs';

let id = 0;
class WebAudioInstance extends EventEmitter {
  constructor(media) {
    super();
    this.id = id++;
    this._media = null;
    this._paused = false;
    this._muted = false;
    this._elapsed = 0;
    this.init(media);
  }
  /**
   * Set a property by name, this makes it easy to chain values
   * @param name - Name of the property to set.
   * @param value - Value to set property to.
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
        case "muted":
          this.muted = value;
          break;
        case "loop":
          this.loop = value;
          break;
        case "paused":
          this.paused = value;
          break;
      }
    }
    return this;
  }
  /** Stops the instance, don't use after this. */
  stop() {
    if (this._source) {
      this._internalStop();
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
    this._update(true);
  }
  /** Get the set the volume for this instance from 0 to 1 */
  get volume() {
    return this._volume;
  }
  set volume(volume) {
    this._volume = volume;
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
  /** If the sound instance should loop playback */
  get loop() {
    return this._loop;
  }
  set loop(loop) {
    this._loop = loop;
    this.refresh();
  }
  /** The collection of filters. */
  get filters() {
    return this._filters;
  }
  set filters(filters) {
    if (this._filters) {
      this._filters?.filter((filter) => filter).forEach((filter) => filter.disconnect());
      this._filters = null;
      this._source.connect(this._gain);
    }
    this._filters = filters?.length ? filters.slice(0) : null;
    this.refresh();
  }
  /** Refresh loop, volume and speed based on changes to parent */
  refresh() {
    if (!this._source) {
      return;
    }
    const global = this._media.context;
    const sound = this._media.parent;
    this._source.loop = this._loop || sound.loop;
    const globalVolume = global.volume * (global.muted ? 0 : 1);
    const soundVolume = sound.volume * (sound.muted ? 0 : 1);
    const instanceVolume = this._volume * (this._muted ? 0 : 1);
    WebAudioUtils.setParamValue(this._gain.gain, instanceVolume * soundVolume * globalVolume);
    WebAudioUtils.setParamValue(this._source.playbackRate, this._speed * sound.speed * global.speed);
    this.applyFilters();
  }
  /** Connect filters nodes to audio context */
  applyFilters() {
    if (this._filters?.length) {
      this._source.disconnect();
      let source = this._source;
      this._filters.forEach((filter) => {
        source.connect(filter.destination);
        source = filter;
      });
      source.connect(this._gain);
    }
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
          start: this._elapsed % this._duration,
          end: this._end,
          speed: this._speed,
          loop: this._loop,
          volume: this._volume
        });
      }
      this.emit("pause", pausedReal);
    }
  }
  /**
   * Plays the sound.
   * @param options - Play options.
   */
  play(options) {
    const { start, end, speed, loop, volume, muted, filters } = options;
    if (end) {
      console.assert(end > start, "End time is before start time");
    }
    this._paused = false;
    const { source, gain } = this._media.nodes.cloneBufferSource();
    this._source = source;
    this._gain = gain;
    this._speed = speed;
    this._volume = volume;
    this._loop = !!loop;
    this._muted = muted;
    this._filters = filters;
    this.refresh();
    const duration = this._source.buffer.duration;
    this._duration = duration;
    this._end = end;
    this._lastUpdate = this._now();
    this._elapsed = start;
    this._source.onended = this._onComplete.bind(this);
    if (this._loop) {
      this._source.loopEnd = end;
      this._source.loopStart = start;
      this._source.start(0, start);
    } else if (end) {
      this._source.start(0, start, end - start);
    } else {
      this._source.start(0, start);
    }
    this.emit("start");
    this._update(true);
    this.enableTicker(true);
  }
  /** Start the update progress. */
  enableTicker(enabled) {
    Ticker.shared.remove(this._updateListener, this);
    if (enabled) {
      Ticker.shared.add(this._updateListener, this);
    }
  }
  /** The current playback progress from 0 to 1. */
  get progress() {
    return this._progress;
  }
  /** Pauses the sound. */
  get paused() {
    return this._paused;
  }
  set paused(paused) {
    this._paused = paused;
    this.refreshPaused();
  }
  /** Don't use after this. */
  destroy() {
    this.removeAllListeners();
    this._internalStop();
    if (this._gain) {
      this._gain.disconnect();
      this._gain = null;
    }
    if (this._media) {
      this._media.context.events.off("refresh", this.refresh, this);
      this._media.context.events.off("refreshPaused", this.refreshPaused, this);
      this._media = null;
    }
    this._filters?.forEach((filter) => filter.disconnect());
    this._filters = null;
    this._end = null;
    this._speed = 1;
    this._volume = 1;
    this._loop = false;
    this._elapsed = 0;
    this._duration = 0;
    this._paused = false;
    this._muted = false;
    this._pausedReal = false;
  }
  /**
   * To string method for instance.
   * @return The string representation of instance.
   */
  toString() {
    return `[WebAudioInstance id=${this.id}]`;
  }
  /**
   * Get the current time in seconds.
   * @return Seconds since start of context
   */
  _now() {
    return this._media.context.audioContext.currentTime;
  }
  /** Callback for update listener */
  _updateListener() {
    this._update();
  }
  /** Internal update the progress. */
  _update(force = false) {
    if (this._source) {
      const now = this._now();
      const delta = now - this._lastUpdate;
      if (delta > 0 || force) {
        const speed = this._source.playbackRate.value;
        this._elapsed += delta * speed;
        this._lastUpdate = now;
        const duration = this._duration;
        let progress;
        if (this._source.loopStart) {
          const soundLength = this._source.loopEnd - this._source.loopStart;
          progress = (this._source.loopStart + this._elapsed % soundLength) / duration;
        } else {
          progress = this._elapsed % duration / duration;
        }
        this._progress = progress;
        this.emit("progress", this._progress, duration);
      }
    }
  }
  /** Initializes the instance. */
  init(media) {
    this._media = media;
    media.context.events.on("refresh", this.refresh, this);
    media.context.events.on("refreshPaused", this.refreshPaused, this);
  }
  /** Stops the instance. */
  _internalStop() {
    if (this._source) {
      this.enableTicker(false);
      this._source.onended = null;
      this._source.stop(0);
      this._source.disconnect();
      try {
        this._source.buffer = null;
      } catch (err) {
        console.warn("Failed to set AudioBufferSourceNode.buffer to null:", err);
      }
      this._source = null;
    }
  }
  /** Callback when completed. */
  _onComplete() {
    if (this._source) {
      this.enableTicker(false);
      this._source.onended = null;
      this._source.disconnect();
      try {
        this._source.buffer = null;
      } catch (err) {
        console.warn("Failed to set AudioBufferSourceNode.buffer to null:", err);
      }
    }
    this._source = null;
    this._progress = 1;
    this.emit("progress", 1, this._duration);
    this.emit("end", this);
  }
}

export { WebAudioInstance };
//# sourceMappingURL=WebAudioInstance.mjs.map
