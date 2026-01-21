import { Filter } from './filters/Filter';
import { IMedia, IMediaContext, IMediaInstance } from './interfaces';
import { SoundSprite, SoundSpriteData, SoundSprites } from './SoundSprite';
/**
 * Options to use for creating sounds.
 */
interface Options {
    /**
     * `true` to immediately start preloading.
     * @default false
     */
    autoPlay?: boolean;
    /**
     * `true` to disallow playing multiple layered instances at once.
     * @default false
     */
    singleInstance?: boolean;
    /**
     * The amount of volume 1 = 100%.
     * @default 1
     */
    volume?: number;
    /**
     * The playback rate where 1 is 100% speed.
     * @default 1
     */
    speed?: number;
    /**
     * Global complete callback when play is finished.
     * @type {Function}
     */
    complete?: CompleteCallback;
    /**
     * Call when finished loading.
     * @type {Function}
     */
    loaded?: LoadedCallback;
    /**
     * `true` to immediately start preloading if loading from `url`.
     */
    preload?: boolean;
    /**
     * Initial loop value, `true` is loop infinitely
     * @default false
     */
    loop?: boolean;
    /**
     * The source of the file being loaded
     */
    url?: string | string[];
    /**
     * If sound is already preloaded, available.
     */
    source?: ArrayBuffer | AudioBuffer | HTMLAudioElement;
    /**
     * The map of sprite data. Where a sprite is an object
     * with a `start` and `end`, which are the times in seconds. Optionally, can include
     * a `speed` amount where 1 is 100% speed.
     */
    sprites?: Record<string, SoundSpriteData>;
}
/**
 * Options used for sound playback.
 */
interface PlayOptions {
    /**
     * Start time offset in seconds.
     * @default 0
     */
    start?: number;
    /**
     * End time in seconds.
     */
    end?: number;
    /**
     * Override default speed, default to the Sound's speed setting.
     */
    speed?: number;
    /**
    * Override default loop, default to the Sound's loop setting.
    */
    loop?: boolean;
    /**
     * Override default volume, default to the Sound's volume setting.
     */
    volume?: number;
    /**
     * The sprite to play.
     */
    sprite?: string;
    /**
     * If sound instance is muted by default.
     * @default false
     */
    muted?: boolean;
    /**
     * Filters that apply to play.
     * Only supported with WebAudio.
     */
    filters?: Filter[];
    /**
     * When completed.
     * @type {Function}
     */
    complete?: CompleteCallback;
    /**
     * If not already preloaded, callback when finishes load.
     * @type {Function}
     */
    loaded?: LoadedCallback;
    /**
     * Setting `true` will stop any playing instances. This is the same as
     * the singleInstance property on Sound, but is play-specific.
     */
    singleInstance?: boolean;
}
/**
 * Callback when sound is loaded.
 * @ignore
 * @param {Error} err - The callback error.
 * @param {Sound} sound - The instance of new sound.
 * @param {IMediaInstance} instance - The instance of auto-played sound.
 */
type LoadedCallback = (err: Error, sound?: Sound, instance?: IMediaInstance) => void;
/**
 * Callback when sound is completed.
 * @ignore
 * @param {Sound} sound - The instance of sound.
 */
type CompleteCallback = (sound: Sound) => void;
type SoundSpriteDataMap = Record<string, SoundSpriteData>;
/**
 * Sound represents a single piece of loaded media. When playing a sound {@link IMediaInstance} objects
 * are created. Properties such a `volume`, `pause`, `mute`, `speed`, etc will have an effect on all instances.
 */
declare class Sound {
    /** Pool of instances */
    private static _pool;
    /**
     * `true` if the buffer is loaded.
     * @default false
     */
    isLoaded: boolean;
    /**
     * `true` if the sound is currently being played.
     * @default false
     * @readonly
     */
    isPlaying: boolean;
    /**
     * true to start playing immediate after load.
     * @default false
     * @readonly
     */
    autoPlay: boolean;
    /**
     * `true` to disallow playing multiple layered instances at once.
     * @default false
     */
    singleInstance: boolean;
    /**
     * `true` to immediately start preloading.
     * @default false
     * @readonly
     */
    preload: boolean;
    /**
     * The file source to load.
     * @readonly
     */
    url: string;
    /**
     * The constructor options.
     * @readonly
     */
    options: Options;
    /** The audio source */
    media: IMedia;
    /** The list of play calls while waiting to preload the sound. */
    private _preloadQueue;
    /** The collection of instances being played. */
    private _instances;
    /** The user defined sound sprites. */
    private _sprites;
    /** The options when auto-playing. */
    private _autoPlayOptions;
    /** The internal volume. */
    private _volume;
    /** The internal paused state. */
    private _paused;
    /** The internal muted state. */
    private _muted;
    /** The internal volume. */
    private _loop;
    /** The internal playbackRate */
    private _speed;
    /**
     * Create a new sound instance from source.
     * @param source - Either the path or url to the source file.
     *        or the object of options to use.
     * @return Created sound instance.
     */
    static from(source: string | string[] | Options | ArrayBuffer | HTMLAudioElement | AudioBuffer): Sound;
    /**
     * Use `Sound.from`
     * @ignore
     */
    constructor(media: IMedia, options: Options);
    /**
     * Internal help for resolving which file to use if there are multiple provide
     * this is especially helpful for working with bundlers (non Assets loading).
     */
    private preferUrl;
    /** Instance of the media context. */
    get context(): IMediaContext;
    /** Stops all the instances of this sound from playing. */
    pause(): this;
    /** Resuming all the instances of this sound from playing */
    resume(): this;
    /** Stops all the instances of this sound from playing. */
    get paused(): boolean;
    set paused(paused: boolean);
    /** The playback rate. */
    get speed(): number;
    set speed(speed: number);
    /** Set the filters. Only supported with WebAudio. */
    get filters(): Filter[];
    set filters(filters: Filter[]);
    /**
     * Add a sound sprite, which is a saved instance of a longer sound.
     * Similar to an image spritesheet.
     * @param alias - The unique name of the sound sprite.
     * @param data - Either completed function or play options.
     */
    addSprites(alias: string, data: SoundSpriteData): SoundSprite;
    /**
     * Convenience method to add more than one sprite add a time.
     * @param data - Map of sounds to add where the key is the alias,
     *        and the data are configuration options.
     * @return The map of sound sprites added.
     */
    addSprites(data: SoundSpriteDataMap): SoundSprites;
    /** Destructor, safer to use `SoundLibrary.remove(alias)` to remove this sound. */
    destroy(): void;
    /**
     * Remove a sound sprite.
     * @param alias - The unique name of the sound sprite, if alias is omitted, removes all sprites.
     */
    removeSprites(alias?: string): Sound;
    /** If the current sound is playable (loaded). */
    get isPlayable(): boolean;
    /** Stops all the instances of this sound from playing. */
    stop(): this;
    /**
     * Play a sound sprite, which is a saved instance of a longer sound.
     * Similar to an image spritesheet.
     * @method play
     * @instance
     * @param alias - The unique name of the sound sprite.
     * @param {Function} callback - Callback when completed.
     * @return The sound instance,
     *        this cannot be reused after it is done playing. Returns a Promise if the sound
     *        has not yet loaded.
     */
    play(alias: string, callback?: CompleteCallback): IMediaInstance | Promise<IMediaInstance>;
    /**
     * Plays the sound.
     * @method play
     * @instance
     * @param {Function|PlayOptions} source - Either completed function or play options.
     * @param {Function} callback - Callback when completed.
     * @return The sound instance,
     *        this cannot be reused after it is done playing. Returns a Promise if the sound
     *        has not yet loaded.
     */
    play(source?: string | PlayOptions | CompleteCallback, callback?: CompleteCallback): IMediaInstance | Promise<IMediaInstance>;
    /** Internal only, speed, loop, volume change occured. */
    refresh(): void;
    /** Handle changes in paused state. Internal only. */
    refreshPaused(): void;
    /** Gets and sets the volume. */
    get volume(): number;
    set volume(volume: number);
    /** Gets and sets the muted flag. */
    get muted(): boolean;
    set muted(muted: boolean);
    /** Gets and sets the looping. */
    get loop(): boolean;
    set loop(loop: boolean);
    /** Starts the preloading of sound. */
    private _preload;
    /** Gets the list of instances that are currently being played of this sound. */
    get instances(): IMediaInstance[];
    /** Get the map of sprites. */
    get sprites(): SoundSprites;
    /** Get the duration of the audio in seconds. */
    get duration(): number;
    /** Auto play the first instance. */
    autoPlayStart(): IMediaInstance;
    /** Removes all instances. */
    private _removeInstances;
    /**
     * Sound instance completed.
     * @param instance
     */
    private _onComplete;
    /** Create a new instance. */
    private _createInstance;
    /**
     * Destroy/recycling the instance object.
     * @param instance - Instance to recycle
     */
    private _poolInstance;
}
export { Sound };
export type { CompleteCallback, LoadedCallback, Options, PlayOptions, SoundSpriteDataMap };
