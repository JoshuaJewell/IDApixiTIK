import { HTMLAudioContext } from './htmlaudio/HTMLAudioContext.mjs';
import { Sound } from './Sound.mjs';
import { WebAudioContext } from './webaudio/WebAudioContext.mjs';

class SoundLibrary {
  constructor() {
    this.init();
  }
  /**
   * Re-initialize the sound library, this will
   * recreate the AudioContext. If there's a hardware-failure
   * call `close` and then `init`.
   * @return Sound instance
   */
  init() {
    if (this.supported) {
      this._webAudioContext = new WebAudioContext();
    }
    this._htmlAudioContext = new HTMLAudioContext();
    this._sounds = {};
    this.useLegacy = !this.supported;
    return this;
  }
  /**
   * The global context to use.
   * @readonly
   */
  get context() {
    return this._context;
  }
  /**
   * Apply filters to all sounds. Can be useful
   * for setting global planning or global effects.
   * **Only supported with WebAudio.**
   * @example
   * import { sound, filters } from '@pixi/sound';
   * // Adds a filter to pan all output left
   * sound.filtersAll = [
   *     new filters.StereoFilter(-1)
   * ];
   */
  get filtersAll() {
    if (!this.useLegacy) {
      return this._context.filters;
    }
    return [];
  }
  set filtersAll(filtersAll) {
    if (!this.useLegacy) {
      this._context.filters = filtersAll;
    }
  }
  /**
   * `true` if WebAudio is supported on the current browser.
   */
  get supported() {
    return WebAudioContext.AudioContext !== null;
  }
  /**
   * @ignore
   */
  add(source, sourceOptions) {
    if (typeof source === "object") {
      const results = {};
      for (const alias in source) {
        const options2 = this._getOptions(
          source[alias],
          sourceOptions
        );
        results[alias] = this.add(alias, options2);
      }
      return results;
    }
    console.assert(!this._sounds[source], `Sound with alias ${source} already exists.`);
    if (sourceOptions instanceof Sound) {
      this._sounds[source] = sourceOptions;
      return sourceOptions;
    }
    const options = this._getOptions(sourceOptions);
    const sound = Sound.from(options);
    this._sounds[source] = sound;
    return sound;
  }
  /**
   * Internal methods for getting the options object
   * @private
   * @param source - The source options
   * @param overrides - Override default options
   * @return The construction options
   */
  _getOptions(source, overrides) {
    let options;
    if (typeof source === "string") {
      options = { url: source };
    } else if (Array.isArray(source)) {
      options = { url: source };
    } else if (source instanceof ArrayBuffer || source instanceof AudioBuffer || source instanceof HTMLAudioElement) {
      options = { source };
    } else {
      options = source;
    }
    options = { ...options, ...overrides || {} };
    return options;
  }
  /**
   * Do not use WebAudio, force the use of legacy. This **must** be called before loading any files.
   */
  get useLegacy() {
    return this._useLegacy;
  }
  set useLegacy(legacy) {
    this._useLegacy = legacy;
    this._context = !legacy && this.supported ? this._webAudioContext : this._htmlAudioContext;
  }
  /**
   * This disables auto-pause all playback when the window blurs (WebAudio only).
   * This is helpful to keep from playing sounds when the user switches tabs.
   * However, if you're running content within an iframe, this may be undesirable
   * and you should disable (set to `true`) this behavior.
   * @default false
   */
  get disableAutoPause() {
    return !this._webAudioContext.autoPause;
  }
  set disableAutoPause(autoPause) {
    this._webAudioContext.autoPause = !autoPause;
  }
  /**
   * Removes a sound by alias.
   * @param alias - The sound alias reference.
   * @return Instance for chaining.
   */
  remove(alias) {
    this.exists(alias, true);
    this._sounds[alias].destroy();
    delete this._sounds[alias];
    return this;
  }
  /**
   * Set the global volume for all sounds. To set per-sound volume see {@link SoundLibrary#volume}.
   */
  get volumeAll() {
    return this._context.volume;
  }
  set volumeAll(volume) {
    this._context.volume = volume;
    this._context.refresh();
  }
  /**
   * Set the global speed for all sounds. To set per-sound speed see {@link SoundLibrary#speed}.
   */
  get speedAll() {
    return this._context.speed;
  }
  set speedAll(speed) {
    this._context.speed = speed;
    this._context.refresh();
  }
  /**
   * Toggle paused property for all sounds.
   * @return `true` if all sounds are paused.
   */
  togglePauseAll() {
    return this._context.togglePause();
  }
  /**
   * Pauses any playing sounds.
   * @return Instance for chaining.
   */
  pauseAll() {
    this._context.paused = true;
    this._context.refreshPaused();
    return this;
  }
  /**
   * Resumes any sounds.
   * @return Instance for chaining.
   */
  resumeAll() {
    this._context.paused = false;
    this._context.refreshPaused();
    return this;
  }
  /**
   * Toggle muted property for all sounds.
   * @return `true` if all sounds are muted.
   */
  toggleMuteAll() {
    return this._context.toggleMute();
  }
  /**
   * Mutes all playing sounds.
   * @return Instance for chaining.
   */
  muteAll() {
    this._context.muted = true;
    this._context.refresh();
    return this;
  }
  /**
   * Unmutes all playing sounds.
   * @return Instance for chaining.
   */
  unmuteAll() {
    this._context.muted = false;
    this._context.refresh();
    return this;
  }
  /**
   * Stops and removes all sounds. They cannot be used after this.
   * @return Instance for chaining.
   */
  removeAll() {
    for (const alias in this._sounds) {
      this._sounds[alias].destroy();
      delete this._sounds[alias];
    }
    return this;
  }
  /**
   * Stops all sounds.
   * @return Instance for chaining.
   */
  stopAll() {
    for (const alias in this._sounds) {
      this._sounds[alias].stop();
    }
    return this;
  }
  /**
   * Checks if a sound by alias exists.
   * @param alias - Check for alias.
   * @param assert - Whether enable console.assert.
   * @return true if the sound exists.
   */
  exists(alias, assert = false) {
    const exists = !!this._sounds[alias];
    if (assert) {
      console.assert(exists, `No sound matching alias '${alias}'.`);
    }
    return exists;
  }
  /**
   * Convenience function to check to see if any sound is playing.
   * @returns `true` if any sound is currently playing.
   */
  isPlaying() {
    for (const alias in this._sounds) {
      if (this._sounds[alias].isPlaying) {
        return true;
      }
    }
    return false;
  }
  /**
   * Find a sound by alias.
   * @param alias - The sound alias reference.
   * @return Sound object.
   */
  find(alias) {
    this.exists(alias, true);
    return this._sounds[alias];
  }
  /**
   * Plays a sound.
   * @method play
   * @instance
   * @param {string} alias - The sound alias reference.
   * @param {string} sprite - The alias of the sprite to play.
   * @return {IMediaInstance|null} The sound instance, this cannot be reused
   *         after it is done playing. Returns `null` if the sound has not yet loaded.
   */
  /**
   * Plays a sound.
   * @param alias - The sound alias reference.
   * @param {PlayOptions|Function} options - The options or callback when done.
   * @return The sound instance,
   *        this cannot be reused after it is done playing. Returns a Promise if the sound
   *        has not yet loaded.
   */
  play(alias, options) {
    return this.find(alias).play(options);
  }
  /**
   * Stops a sound.
   * @param alias - The sound alias reference.
   * @return Sound object.
   */
  stop(alias) {
    return this.find(alias).stop();
  }
  /**
   * Pauses a sound.
   * @param alias - The sound alias reference.
   * @return Sound object.
   */
  pause(alias) {
    return this.find(alias).pause();
  }
  /**
   * Resumes a sound.
   * @param alias - The sound alias reference.
   * @return Instance for chaining.
   */
  resume(alias) {
    return this.find(alias).resume();
  }
  /**
   * Get or set the volume for a sound.
   * @param alias - The sound alias reference.
   * @param volume - Optional current volume to set.
   * @return The current volume.
   */
  volume(alias, volume) {
    const sound = this.find(alias);
    if (volume !== void 0) {
      sound.volume = volume;
    }
    return sound.volume;
  }
  /**
   * Get or set the speed for a sound.
   * @param alias - The sound alias reference.
   * @param speed - Optional current speed to set.
   * @return The current speed.
   */
  speed(alias, speed) {
    const sound = this.find(alias);
    if (speed !== void 0) {
      sound.speed = speed;
    }
    return sound.speed;
  }
  /**
   * Get the length of a sound in seconds.
   * @param alias - The sound alias reference.
   * @return The current duration in seconds.
   */
  duration(alias) {
    return this.find(alias).duration;
  }
  /**
   * Closes the sound library. This will release/destroy
   * the AudioContext(s). Can be used safely if you want to
   * initialize the sound library later. Use `init` method.
   */
  close() {
    this.removeAll();
    this._sounds = null;
    if (this._webAudioContext) {
      this._webAudioContext.destroy();
      this._webAudioContext = null;
    }
    if (this._htmlAudioContext) {
      this._htmlAudioContext.destroy();
      this._htmlAudioContext = null;
    }
    this._context = null;
    return this;
  }
}

export { SoundLibrary };
//# sourceMappingURL=SoundLibrary.mjs.map
