import { EventEmitter } from 'pixi.js';
import { Filterable } from '../Filterable';
import { IMediaContext } from '../interfaces';
/**
 * Main class to handle WebAudio API. There's a simple chain
 * of AudioNode elements: analyser > compressor > context.destination.
 * any filters that are added are inserted between the analyser and compressor nodes
 * @memberof webaudio
 */
declare class WebAudioContext extends Filterable implements IMediaContext {
    /**
     * Context Compressor node
     * @readonly
     */
    compressor: DynamicsCompressorNode;
    /**
     * Context Analyser node
     * @readonly
     */
    analyser: AnalyserNode;
    /**
     * Global speed of all sounds
     * @readonly
     */
    speed: number;
    /**
     * Sets the muted state.
     * @default false
     */
    muted: boolean;
    /**
     * Sets the volume from 0 to 1.
     * @default 1
     */
    volume: number;
    /**
     * Handle global events
     * @type {PIXI.EventEmitter}
     */
    events: EventEmitter;
    /** The instance of the AudioContext for WebAudio API. */
    private _ctx;
    /** The instance of the OfflineAudioContext for fast decoding audio. */
    private _offlineCtx;
    /** Current paused status */
    private _paused;
    /**
     * Indicated whether audio on iOS has been unlocked, which requires a touchend/mousedown event that plays an
     * empty sound.
     */
    private _locked;
    /** The paused state when blurring the current window */
    private _pausedOnBlur;
    /** Set to false ignore suspending when window is blurred */
    autoPause: boolean;
    constructor();
    /** Handle mobile WebAudio context resume */
    private onFocus;
    /** Handle mobile WebAudio context suspend */
    private onBlur;
    /**
     * Try to unlock audio on iOS. This is triggered from either WebAudio plugin setup (which will work if inside of
     * a `mousedown` or `touchend` event stack), or the first document touchend/mousedown event. If it fails (touchend
     * will fail if the user presses for too long, indicating a scroll event instead of a click event.
     *
     * Note that earlier versions of iOS supported `touchstart` for this, but iOS9 removed this functionality. Adding
     * a `touchstart` event to support older platforms may preclude a `mousedown` even from getting fired on iOS9, so we
     * stick with `mousedown` and `touchend`.
     */
    private _unlock;
    /**
     * Plays an empty sound in the web audio context.  This is used to enable web audio on iOS devices, as they
     * require the first sound to be played inside of a user initiated event (touch/click).
     */
    playEmptySound(): void;
    /**
     * Get AudioContext class, if not supported returns `null`
     * @type {AudioContext}
     * @readonly
     */
    static get AudioContext(): typeof AudioContext;
    /**
     * Get OfflineAudioContext class, if not supported returns `null`
     * @type {OfflineAudioContext}
     * @readonly
     */
    static get OfflineAudioContext(): typeof OfflineAudioContext;
    /** Destroy this context. */
    destroy(): void;
    /**
     * The WebAudio API AudioContext object.
     * @readonly
     * @type {AudioContext}
     */
    get audioContext(): AudioContext;
    /**
     * The WebAudio API OfflineAudioContext object.
     * @readonly
     * @type {OfflineAudioContext}
     */
    get offlineContext(): OfflineAudioContext;
    /**
     * Pauses all sounds, even though we handle this at the instance
     * level, we'll also pause the audioContext so that the
     * time used to compute progress isn't messed up.
     * @default false
     */
    set paused(paused: boolean);
    get paused(): boolean;
    /** Emit event when muted, volume or speed changes */
    refresh(): void;
    /** Emit event when muted, volume or speed changes */
    refreshPaused(): void;
    /**
     * Toggles the muted state.
     * @return The current muted state.
     */
    toggleMute(): boolean;
    /**
     * Toggles the paused state.
     * @return The current muted state.
     */
    togglePause(): boolean;
    /**
     * Decode the audio data
     * @param arrayBuffer - Buffer from loader
     * @param callback - When completed, error and audioBuffer are parameters.
     */
    decode(arrayBuffer: ArrayBuffer, callback: (err?: Error, buffer?: AudioBuffer) => void): void;
}
export { WebAudioContext };
