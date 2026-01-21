import { Filterable } from '../Filterable';
import { WebAudioContext } from './WebAudioContext';
/** Output for cloning source node. */
interface SourceClone {
    /** Cloned audio buffer source */
    source: AudioBufferSourceNode;
    /** Independent volume control */
    gain: GainNode;
}
/**
 * @memberof webaudio
 */
declare class WebAudioNodes extends Filterable {
    /**
     * The buffer size for script processor, default is `0` which auto-detects. If you plan to use
     * script node on iOS, you'll need to provide a non-zero amount.
     * @default 0
     */
    static BUFFER_SIZE: number;
    /**
     * Get the buffer source node
     * @readonly
     */
    bufferSource: AudioBufferSourceNode;
    /**
     * Get the gain node
     * @readonly
     */
    gain: GainNode;
    /**
     * Get the analyser node
     * @readonly
     */
    analyser: AnalyserNode;
    /**
     * Reference to the SoundContext
     * @readonly
     */
    context: WebAudioContext;
    /** Private reference to the script processor node. */
    private _script;
    /**
     * @param context - The audio context.
     */
    constructor(context: WebAudioContext);
    /**
     * Get the script processor node.
     * @readonly
     */
    get script(): ScriptProcessorNode;
    /** Cleans up. */
    destroy(): void;
    /**
     * Clones the bufferSource. Used just before playing a sound.
     * @returns {SourceClone} The clone AudioBufferSourceNode.
     */
    cloneBufferSource(): SourceClone;
    /**
     * Get buffer size of `ScriptProcessorNode`.
     * @readonly
     */
    get bufferSize(): number;
}
export type { SourceClone };
export { WebAudioNodes };
