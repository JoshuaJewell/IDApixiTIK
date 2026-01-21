import { EventEmitter } from 'pixi.js';
import { Filter } from '../filters/Filter';
import { IMediaInstance } from '../interfaces/IMediaInstance';
import { PlayOptions } from '../Sound';
import { HTMLAudioMedia } from './HTMLAudioMedia';
/**
 * Instance which wraps the `<audio>` element playback.
 * @memberof htmlaudio
 * @extends PIXI.EventEmitter
 */
declare class HTMLAudioInstance extends EventEmitter implements IMediaInstance {
    /** Extra padding, in seconds, to deal with low-latecy of HTMLAudio. */
    static readonly PADDING: number;
    /** The current unique ID for this instance. */
    readonly id: number;
    /** The instance of the Audio element. */
    private _source;
    /** The instance of the Audio media element. */
    private _media;
    /** Playback rate, where 1 is 100%. */
    private _end;
    /** Current instance paused state. */
    private _paused;
    /** Current instance muted state. */
    private _muted;
    /** Current actual paused state. */
    private _pausedReal;
    /** Total length of the audio. */
    private _duration;
    /** Playback rate, where 1 is 100%. */
    private _start;
    /** `true` if the audio is actually playing. */
    private _playing;
    /** Volume for the instance. */
    private _volume;
    /** Speed for the instance. */
    private _speed;
    /** `true` for looping the playback */
    private _loop;
    /** @param parent - Parent element */
    constructor(parent: HTMLAudioMedia);
    /**
     * Set a property by name, this makes it easy to chain values
     * @param name - Name of the property to set
     * @param value - Value to set property to
     */
    set(name: 'speed' | 'volume' | 'muted' | 'loop' | 'paused', value: number | boolean): this;
    /** The current playback progress from 0 to 1. */
    get progress(): number;
    /** Pauses the sound. */
    get paused(): boolean;
    set paused(paused: boolean);
    /**
     * Reference: http://stackoverflow.com/a/40370077
     * @private
     */
    private _onPlay;
    /**
     * Reference: http://stackoverflow.com/a/40370077
     * @private
     */
    private _onPause;
    /**
     * Initialize the instance.
     * @param {htmlaudio.HTMLAudioMedia} media - Same as constructor
     */
    init(media: HTMLAudioMedia): void;
    /**
     * Stop the sound playing
     * @private
     */
    private _internalStop;
    /** Stop the sound playing */
    stop(): void;
    /** Set the instance speed from 0 to 1 */
    get speed(): number;
    set speed(speed: number);
    /** Get the set the volume for this instance from 0 to 1 */
    get volume(): number;
    set volume(volume: number);
    /** If the sound instance should loop playback */
    get loop(): boolean;
    set loop(loop: boolean);
    /** `true` if the sound is muted */
    get muted(): boolean;
    set muted(muted: boolean);
    /**
     * HTML Audio does not support filters, this is non-functional API.
     */
    get filters(): Filter[];
    set filters(_filters: Filter[]);
    /** Call whenever the loop, speed or volume changes */
    refresh(): void;
    /** Handle changes in paused state, either globally or sound or instance */
    refreshPaused(): void;
    /** Start playing the sound/ */
    play(options: PlayOptions): void;
    /**
     * Handle time update on sound.
     * @private
     */
    private _onUpdate;
    /**
     * Callback when completed.
     * @private
     */
    private _onComplete;
    /** Don't use after this. */
    destroy(): void;
    /**
     * To string method for instance.
     * @return The string representation of instance.
     */
    toString(): string;
}
export { HTMLAudioInstance };
