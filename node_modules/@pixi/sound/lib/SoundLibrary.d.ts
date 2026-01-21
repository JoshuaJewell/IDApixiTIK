import { Filter } from './filters/Filter';
import { IMediaContext } from './interfaces/IMediaContext';
import { IMediaInstance } from './interfaces/IMediaInstance';
import { CompleteCallback, Options, PlayOptions, Sound } from './Sound';
type SoundSourceMap = Record<string, Options | string | ArrayBuffer | AudioBuffer | HTMLAudioElement>;
type SoundMap = Record<string, Sound>;
/**
 * Manages the playback of sounds. This is the main class for PixiJS Sound. If you're
 * using the browser-based bundled this is `PIXI.sound`. Otherwise, you can do this:
 * @example
 * import { sound } from '@pixi/sound';
 *
 * // sound is an instance of SoundLibrary
 * sound.add('my-sound', 'path/to/file.mp3');
 * sound.play('my-sound');
 */
declare class SoundLibrary {
    /**
     * For legacy approach for Audio. Instead of using WebAudio API
     * for playback of sounds, it will use HTML5 `<audio>` element.
     */
    private _useLegacy;
    /** The global context to use. */
    private _context;
    /** The WebAudio specific context */
    private _webAudioContext;
    /** The HTML Audio (legacy) context. */
    private _htmlAudioContext;
    /** The map of all sounds by alias. */
    private _sounds;
    constructor();
    /**
     * Re-initialize the sound library, this will
     * recreate the AudioContext. If there's a hardware-failure
     * call `close` and then `init`.
     * @return Sound instance
     */
    init(): this;
    /**
     * The global context to use.
     * @readonly
     */
    get context(): IMediaContext;
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
    get filtersAll(): Filter[];
    set filtersAll(filtersAll: Filter[]);
    /**
     * `true` if WebAudio is supported on the current browser.
     */
    get supported(): boolean;
    /**
     * Register an existing sound with the library cache.
     * @method add
     * @instance
     * @param {string} alias - The sound alias reference.
     * @param {Sound} sound - Sound reference to use.
     * @return {Sound} Instance of the Sound object.
     */
    /**
     * Adds a new sound by alias.
     * @param alias - The sound alias reference.
     * @param {ArrayBuffer|AudioBuffer|String|Options|HTMLAudioElement} options - Either the path or url to the source file.
     *        or the object of options to use.
     * @return Instance of the Sound object.
     */
    add(alias: string, options: Options | string | ArrayBuffer | AudioBuffer | HTMLAudioElement | Sound): Sound;
    /**
     * Adds multiple sounds at once.
     * @param map - Map of sounds to add, the key is the alias, the value is the
     *        `string`, `ArrayBuffer`, `AudioBuffer`, `HTMLAudioElement` or the list of options
     *        (see {@link Options} for full options).
     * @param globalOptions - The default options for all sounds.
     *        if a property is defined, it will use the local property instead.
     * @return Instance to the Sound object.
     */
    add(map: SoundSourceMap, globalOptions?: Options): SoundMap;
    /**
     * Internal methods for getting the options object
     * @private
     * @param source - The source options
     * @param overrides - Override default options
     * @return The construction options
     */
    private _getOptions;
    /**
     * Do not use WebAudio, force the use of legacy. This **must** be called before loading any files.
     */
    get useLegacy(): boolean;
    set useLegacy(legacy: boolean);
    /**
     * This disables auto-pause all playback when the window blurs (WebAudio only).
     * This is helpful to keep from playing sounds when the user switches tabs.
     * However, if you're running content within an iframe, this may be undesirable
     * and you should disable (set to `true`) this behavior.
     * @default false
     */
    get disableAutoPause(): boolean;
    set disableAutoPause(autoPause: boolean);
    /**
     * Removes a sound by alias.
     * @param alias - The sound alias reference.
     * @return Instance for chaining.
     */
    remove(alias: string): this;
    /**
     * Set the global volume for all sounds. To set per-sound volume see {@link SoundLibrary#volume}.
     */
    get volumeAll(): number;
    set volumeAll(volume: number);
    /**
     * Set the global speed for all sounds. To set per-sound speed see {@link SoundLibrary#speed}.
     */
    get speedAll(): number;
    set speedAll(speed: number);
    /**
     * Toggle paused property for all sounds.
     * @return `true` if all sounds are paused.
     */
    togglePauseAll(): boolean;
    /**
     * Pauses any playing sounds.
     * @return Instance for chaining.
     */
    pauseAll(): this;
    /**
     * Resumes any sounds.
     * @return Instance for chaining.
     */
    resumeAll(): this;
    /**
     * Toggle muted property for all sounds.
     * @return `true` if all sounds are muted.
     */
    toggleMuteAll(): boolean;
    /**
     * Mutes all playing sounds.
     * @return Instance for chaining.
     */
    muteAll(): this;
    /**
     * Unmutes all playing sounds.
     * @return Instance for chaining.
     */
    unmuteAll(): this;
    /**
     * Stops and removes all sounds. They cannot be used after this.
     * @return Instance for chaining.
     */
    removeAll(): this;
    /**
     * Stops all sounds.
     * @return Instance for chaining.
     */
    stopAll(): this;
    /**
     * Checks if a sound by alias exists.
     * @param alias - Check for alias.
     * @param assert - Whether enable console.assert.
     * @return true if the sound exists.
     */
    exists(alias: string, assert?: boolean): boolean;
    /**
     * Convenience function to check to see if any sound is playing.
     * @returns `true` if any sound is currently playing.
     */
    isPlaying(): boolean;
    /**
     * Find a sound by alias.
     * @param alias - The sound alias reference.
     * @return Sound object.
     */
    find(alias: string): Sound;
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
    play(alias: string, options?: PlayOptions | CompleteCallback | string): IMediaInstance | Promise<IMediaInstance>;
    /**
     * Stops a sound.
     * @param alias - The sound alias reference.
     * @return Sound object.
     */
    stop(alias: string): Sound;
    /**
     * Pauses a sound.
     * @param alias - The sound alias reference.
     * @return Sound object.
     */
    pause(alias: string): Sound;
    /**
     * Resumes a sound.
     * @param alias - The sound alias reference.
     * @return Instance for chaining.
     */
    resume(alias: string): Sound;
    /**
     * Get or set the volume for a sound.
     * @param alias - The sound alias reference.
     * @param volume - Optional current volume to set.
     * @return The current volume.
     */
    volume(alias: string, volume?: number): number;
    /**
     * Get or set the speed for a sound.
     * @param alias - The sound alias reference.
     * @param speed - Optional current speed to set.
     * @return The current speed.
     */
    speed(alias: string, speed?: number): number;
    /**
     * Get the length of a sound in seconds.
     * @param alias - The sound alias reference.
     * @return The current duration in seconds.
     */
    duration(alias: string): number;
    /**
     * Closes the sound library. This will release/destroy
     * the AudioContext(s). Can be used safely if you want to
     * initialize the sound library later. Use `init` method.
     */
    close(): this;
}
export { SoundLibrary };
export type { SoundMap, SoundSourceMap };
