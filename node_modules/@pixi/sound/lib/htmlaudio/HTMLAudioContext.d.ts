import { EventEmitter } from 'pixi.js';
import { Filter } from '../filters/Filter';
import { IMediaContext } from '../interfaces/IMediaContext';
/**
 * The fallback version of WebAudioContext which uses `<audio>` instead of WebAudio API.
 * @memberof htmlaudio
 * @extends PIXI.EventEmitter
 */
declare class HTMLAudioContext extends EventEmitter implements IMediaContext {
    /** Current global speed from 0 to 1 */
    speed: number;
    /** Current muted status of the context */
    muted: boolean;
    /** Current volume from 0 to 1  */
    volume: number;
    /** Current paused status */
    paused: boolean;
    /** Internal trigger when volume, mute or speed changes */
    refresh(): void;
    /** Internal trigger paused changes */
    refreshPaused(): void;
    /**
     * HTML Audio does not support filters, this is non-functional API.
     */
    get filters(): Filter[];
    set filters(_filters: Filter[]);
    /**
     * HTML Audio does not support `audioContext`
     * @readonly
     * @type {AudioContext}
     */
    get audioContext(): AudioContext;
    /**
     * Toggles the muted state.
     * @return The current muted state.
     */
    toggleMute(): boolean;
    /**
     * Toggles the paused state.
     * @return The current paused state.
     */
    togglePause(): boolean;
    /** Destroy and don't use after this */
    destroy(): void;
}
export { HTMLAudioContext };
