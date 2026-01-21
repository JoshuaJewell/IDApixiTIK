import { Filter } from '../filters/Filter';
import { IMedia } from '../interfaces/IMedia';
import { LoadedCallback, Sound } from '../Sound';
import { WebAudioContext } from './WebAudioContext';
import { WebAudioInstance } from './WebAudioInstance';
import { WebAudioNodes } from './WebAudioNodes';
/**
 * Represents a single sound element. Can be used to play, pause, etc. sound instances.
 * @memberof webaudio
 */
declare class WebAudioMedia implements IMedia {
    /**
     * Reference to the parent Sound container.
     * @readonly
     */
    parent: Sound;
    /**
     * The file buffer to load.
     * @readonly
     */
    source: ArrayBuffer | AudioBuffer;
    /** Instance of the chain builder. */
    private _nodes;
    /** Instance of the source node. */
    private _source;
    /**
     * Re-initialize without constructing.
     * @param parent - - Instance of parent Sound container
     */
    init(parent: Sound): void;
    /** Destructor, safer to use `SoundLibrary.remove(alias)` to remove this sound. */
    destroy(): void;
    create(): WebAudioInstance;
    get context(): WebAudioContext;
    get isPlayable(): boolean;
    get filters(): Filter[];
    set filters(filters: Filter[]);
    get duration(): number;
    /** Gets and sets the buffer. */
    get buffer(): AudioBuffer;
    set buffer(buffer: AudioBuffer);
    /** Get the current chained nodes object */
    get nodes(): WebAudioNodes;
    load(callback?: LoadedCallback): void;
    /** Loads a sound using XHMLHttpRequest object. */
    private _loadUrl;
    /**
     * Decodes the array buffer.
     * @param arrayBuffer - From load.
     * @param {Function} callback - Callback optional
     */
    private _decode;
}
export { WebAudioMedia };
