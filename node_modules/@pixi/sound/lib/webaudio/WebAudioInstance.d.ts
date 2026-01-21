import { EventEmitter } from 'pixi.js';
import { Filter } from '../filters/Filter';
import { IMediaInstance } from '../interfaces';
import { PlayOptions } from '../Sound';
import { WebAudioMedia } from './WebAudioMedia';
/**
 * A single play instance that handles the AudioBufferSourceNode.
 * @memberof webaudio
 * @extends PIXI.EventEmitter
 */
declare class WebAudioInstance extends EventEmitter implements IMediaInstance {
    /**
     * The current unique ID for this instance.
     * @readonly
     */
    readonly id: number;
    /** The source Sound. */
    private _media;
    /** true if paused. */
    private _paused;
    /** true if muted. */
    private _muted;
    /** true if paused. */
    private _pausedReal;
    /** The instance volume */
    private _volume;
    /** Last update frame number. */
    private _lastUpdate;
    /** The total number of seconds elapsed in playback. */
    private _elapsed;
    /** Playback rate, where 1 is 100%. */
    private _speed;
    /** Playback rate, where 1 is 100%. */
    private _end;
    /** `true` if should be looping. */
    private _loop;
    /** Gain node for controlling volume of instance */
    private _gain;
    /** Length of the sound in seconds. */
    private _duration;
    /** The progress of the sound from 0 to 1. */
    private _progress;
    /** Audio buffer source clone from Sound object. */
    private _source;
    /** The filters */
    private _filters;
    constructor(media: WebAudioMedia);
    /**
     * Set a property by name, this makes it easy to chain values
     * @param name - Name of the property to set.
     * @param value - Value to set property to.
     */
    set(name: 'speed' | 'volume' | 'muted' | 'loop' | 'paused', value: number | boolean): this;
    /** Stops the instance, don't use after this. */
    stop(): void;
    /** Set the instance speed from 0 to 1 */
    get speed(): number;
    set speed(speed: number);
    /** Get the set the volume for this instance from 0 to 1 */
    get volume(): number;
    set volume(volume: number);
    /** `true` if the sound is muted */
    get muted(): boolean;
    set muted(muted: boolean);
    /** If the sound instance should loop playback */
    get loop(): boolean;
    set loop(loop: boolean);
    /** The collection of filters. */
    get filters(): Filter[];
    set filters(filters: Filter[]);
    /** Refresh loop, volume and speed based on changes to parent */
    refresh(): void;
    /** Connect filters nodes to audio context */
    private applyFilters;
    /** Handle changes in paused state, either globally or sound or instance */
    refreshPaused(): void;
    /**
     * Plays the sound.
     * @param options - Play options.
     */
    play(options: PlayOptions): void;
    /** Start the update progress. */
    private enableTicker;
    /** The current playback progress from 0 to 1. */
    get progress(): number;
    /** Pauses the sound. */
    get paused(): boolean;
    set paused(paused: boolean);
    /** Don't use after this. */
    destroy(): void;
    /**
     * To string method for instance.
     * @return The string representation of instance.
     */
    toString(): string;
    /**
     * Get the current time in seconds.
     * @return Seconds since start of context
     */
    private _now;
    /** Callback for update listener */
    private _updateListener;
    /** Internal update the progress. */
    private _update;
    /** Initializes the instance. */
    init(media: WebAudioMedia): void;
    /** Stops the instance. */
    private _internalStop;
    /** Callback when completed. */
    private _onComplete;
}
export { WebAudioInstance };
