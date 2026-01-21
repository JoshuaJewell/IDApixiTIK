import { path } from 'pixi.js';
import { HTMLAudioMedia } from './htmlaudio/HTMLAudioMedia.mjs';
import { getInstance } from './instance.mjs';
import { SoundSprite } from './SoundSprite.mjs';
import { supported, extensions } from './utils/supported.mjs';
import { WebAudioMedia } from './webaudio/WebAudioMedia.mjs';

const _Sound = class {
  /**
   * Create a new sound instance from source.
   * @param source - Either the path or url to the source file.
   *        or the object of options to use.
   * @return Created sound instance.
   */
  static from(source) {
    let options = {};
    if (typeof source === "string") {
      options.url = source;
    } else if (source instanceof ArrayBuffer || source instanceof AudioBuffer || source instanceof HTMLAudioElement) {
      options.source = source;
    } else if (Array.isArray(source)) {
      options.url = source;
    } else {
      options = source;
    }
    options = {
      autoPlay: false,
      singleInstance: false,
      url: null,
      source: null,
      preload: false,
      volume: 1,
      speed: 1,
      complete: null,
      loaded: null,
      loop: false,
      ...options
    };
    Object.freeze(options);
    const media = getInstance().useLegacy ? new HTMLAudioMedia() : new WebAudioMedia();
    return new _Sound(media, options);
  }
  /**
   * Use `Sound.from`
   * @ignore
   */
  constructor(media, options) {
    this.media = media;
    this.options = options;
    this._instances = [];
    this._sprites = {};
    this.media.init(this);
    const complete = options.complete;
    this._autoPlayOptions = complete ? { complete } : null;
    this.isLoaded = false;
    this._preloadQueue = null;
    this.isPlaying = false;
    this.autoPlay = options.autoPlay;
    this.singleInstance = options.singleInstance;
    this.preload = options.preload || this.autoPlay;
    this.url = Array.isArray(options.url) ? this.preferUrl(options.url) : options.url;
    this.speed = options.speed;
    this.volume = options.volume;
    this.loop = options.loop;
    if (options.sprites) {
      this.addSprites(options.sprites);
    }
    if (this.preload) {
      this._preload(options.loaded);
    }
  }
  /**
   * Internal help for resolving which file to use if there are multiple provide
   * this is especially helpful for working with bundlers (non Assets loading).
   */
  preferUrl(urls) {
    const [file] = urls.map((url) => ({ url, ext: path.extname(url).slice(1) })).filter(({ ext }) => supported[ext]).sort((a, b) => extensions.indexOf(a.ext) - extensions.indexOf(b.ext));
    if (!file) {
      throw new Error("No supported file type found");
    }
    return file.url;
  }
  /** Instance of the media context. */
  get context() {
    return getInstance().context;
  }
  /** Stops all the instances of this sound from playing. */
  pause() {
    this.isPlaying = false;
    this.paused = true;
    return this;
  }
  /** Resuming all the instances of this sound from playing */
  resume() {
    this.isPlaying = this._instances.length > 0;
    this.paused = false;
    return this;
  }
  /** Stops all the instances of this sound from playing. */
  get paused() {
    return this._paused;
  }
  set paused(paused) {
    this._paused = paused;
    this.refreshPaused();
  }
  /** The playback rate. */
  get speed() {
    return this._speed;
  }
  set speed(speed) {
    this._speed = speed;
    this.refresh();
  }
  /** Set the filters. Only supported with WebAudio. */
  get filters() {
    return this.media.filters;
  }
  set filters(filters) {
    this.media.filters = filters;
  }
  /**
   * @ignore
   */
  addSprites(source, data) {
    if (typeof source === "object") {
      const results = {};
      for (const alias in source) {
        results[alias] = this.addSprites(alias, source[alias]);
      }
      return results;
    }
    console.assert(!this._sprites[source], `Alias ${source} is already taken`);
    const sprite = new SoundSprite(this, data);
    this._sprites[source] = sprite;
    return sprite;
  }
  /** Destructor, safer to use `SoundLibrary.remove(alias)` to remove this sound. */
  destroy() {
    this._removeInstances();
    this.removeSprites();
    this.media.destroy();
    this.media = null;
    this._sprites = null;
    this._instances = null;
  }
  /**
   * Remove a sound sprite.
   * @param alias - The unique name of the sound sprite, if alias is omitted, removes all sprites.
   */
  removeSprites(alias) {
    if (!alias) {
      for (const name in this._sprites) {
        this.removeSprites(name);
      }
    } else {
      const sprite = this._sprites[alias];
      if (sprite !== void 0) {
        sprite.destroy();
        delete this._sprites[alias];
      }
    }
    return this;
  }
  /** If the current sound is playable (loaded). */
  get isPlayable() {
    return this.isLoaded && this.media && this.media.isPlayable;
  }
  /** Stops all the instances of this sound from playing. */
  stop() {
    if (!this.isPlayable) {
      this.autoPlay = false;
      this._autoPlayOptions = null;
      return this;
    }
    this.isPlaying = false;
    for (let i = this._instances.length - 1; i >= 0; i--) {
      this._instances[i].stop();
    }
    return this;
  }
  // Overloaded function
  play(source, complete) {
    let options;
    if (typeof source === "string") {
      const sprite = source;
      options = { sprite, loop: this.loop, complete };
    } else if (typeof source === "function") {
      options = {};
      options.complete = source;
    } else {
      options = source;
    }
    options = {
      complete: null,
      loaded: null,
      sprite: null,
      end: null,
      start: 0,
      volume: 1,
      speed: 1,
      muted: false,
      loop: false,
      ...options || {}
    };
    if (options.sprite) {
      const alias = options.sprite;
      console.assert(!!this._sprites[alias], `Alias ${alias} is not available`);
      const sprite = this._sprites[alias];
      options.start = sprite.start + (options.start || 0);
      options.end = sprite.end;
      options.speed = sprite.speed || 1;
      options.loop = sprite.loop || options.loop;
      delete options.sprite;
    }
    if (options.offset) {
      options.start = options.offset;
    }
    if (!this.isLoaded) {
      if (this._preloadQueue) {
        return new Promise((resolve) => {
          this._preloadQueue.push(() => {
            resolve(this.play(options));
          });
        });
      }
      this._preloadQueue = [];
      this.autoPlay = true;
      this._autoPlayOptions = options;
      return new Promise((resolve, reject) => {
        this._preload((err, sound, media) => {
          this._preloadQueue.forEach((resolve2) => resolve2());
          this._preloadQueue = null;
          if (err) {
            reject(err);
          } else {
            if (options.loaded) {
              options.loaded(err, sound, media);
            }
            resolve(media);
          }
        });
      });
    }
    if (this.singleInstance || options.singleInstance) {
      this._removeInstances();
    }
    const instance = this._createInstance();
    this._instances.push(instance);
    this.isPlaying = true;
    instance.once("end", () => {
      if (options.complete) {
        options.complete(this);
      }
      this._onComplete(instance);
    });
    instance.once("stop", () => {
      this._onComplete(instance);
    });
    instance.play(options);
    return instance;
  }
  /** Internal only, speed, loop, volume change occured. */
  refresh() {
    const len = this._instances.length;
    for (let i = 0; i < len; i++) {
      this._instances[i].refresh();
    }
  }
  /** Handle changes in paused state. Internal only. */
  refreshPaused() {
    const len = this._instances.length;
    for (let i = 0; i < len; i++) {
      this._instances[i].refreshPaused();
    }
  }
  /** Gets and sets the volume. */
  get volume() {
    return this._volume;
  }
  set volume(volume) {
    this._volume = volume;
    this.refresh();
  }
  /** Gets and sets the muted flag. */
  get muted() {
    return this._muted;
  }
  set muted(muted) {
    this._muted = muted;
    this.refresh();
  }
  /** Gets and sets the looping. */
  get loop() {
    return this._loop;
  }
  set loop(loop) {
    this._loop = loop;
    this.refresh();
  }
  /** Starts the preloading of sound. */
  _preload(callback) {
    this.media.load(callback);
  }
  /** Gets the list of instances that are currently being played of this sound. */
  get instances() {
    return this._instances;
  }
  /** Get the map of sprites. */
  get sprites() {
    return this._sprites;
  }
  /** Get the duration of the audio in seconds. */
  get duration() {
    return this.media.duration;
  }
  /** Auto play the first instance. */
  autoPlayStart() {
    let instance;
    if (this.autoPlay) {
      instance = this.play(this._autoPlayOptions);
    }
    return instance;
  }
  /** Removes all instances. */
  _removeInstances() {
    for (let i = this._instances.length - 1; i >= 0; i--) {
      this._poolInstance(this._instances[i]);
    }
    this._instances.length = 0;
  }
  /**
   * Sound instance completed.
   * @param instance
   */
  _onComplete(instance) {
    if (this._instances) {
      const index = this._instances.indexOf(instance);
      if (index > -1) {
        this._instances.splice(index, 1);
      }
      this.isPlaying = this._instances.length > 0;
    }
    this._poolInstance(instance);
  }
  /** Create a new instance. */
  _createInstance() {
    if (_Sound._pool.length > 0) {
      const instance = _Sound._pool.pop();
      instance.init(this.media);
      return instance;
    }
    return this.media.create();
  }
  /**
   * Destroy/recycling the instance object.
   * @param instance - Instance to recycle
   */
  _poolInstance(instance) {
    instance.destroy();
    if (_Sound._pool.indexOf(instance) < 0) {
      _Sound._pool.push(instance);
    }
  }
};
let Sound = _Sound;
/** Pool of instances */
Sound._pool = [];

export { Sound };
//# sourceMappingURL=Sound.mjs.map
