import { EventEmitter } from 'pixi.js';
import { Filter } from '../filters/Filter';
import { IMedia } from '../interfaces/IMedia';
import { LoadedCallback, Sound } from '../Sound';
import { HTMLAudioContext } from './HTMLAudioContext';
import { HTMLAudioInstance } from './HTMLAudioInstance';
/**
 * The fallback version of Sound which uses `<audio>` instead of WebAudio API.
 * @memberof htmlaudio
 * @extends PIXI.EventEmitter
 */
declare class HTMLAudioMedia extends EventEmitter implements IMedia {
    parent: Sound;
    private _source;
    init(parent: Sound): void;
    create(): HTMLAudioInstance;
    /**
     * If the audio media is playable (ready).
     * @readonly
     */
    get isPlayable(): boolean;
    /**
     * THe duration of the media in seconds.
     * @readonly
     */
    get duration(): number;
    /**
     * Reference to the context.
     * @readonly
     */
    get context(): HTMLAudioContext;
    /** The collection of filters, does not apply to HTML Audio. */
    get filters(): Filter[];
    set filters(_filters: Filter[]);
    destroy(): void;
    /**
     * Get the audio source element.
     * @type {HTMLAudioElement}
     * @readonly
     */
    get source(): HTMLAudioElement;
    load(callback?: LoadedCallback): void;
}
export { HTMLAudioMedia };
