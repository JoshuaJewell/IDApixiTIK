import { Filterable } from '../Filterable.mjs';
import { WebAudioUtils } from './WebAudioUtils.mjs';

const _WebAudioNodes = class extends Filterable {
  /**
   * @param context - The audio context.
   */
  constructor(context) {
    const audioContext = context.audioContext;
    const bufferSource = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    const analyser = audioContext.createAnalyser();
    bufferSource.connect(analyser);
    analyser.connect(gain);
    gain.connect(context.destination);
    super(analyser, gain);
    this.context = context;
    this.bufferSource = bufferSource;
    this.gain = gain;
    this.analyser = analyser;
  }
  /**
   * Get the script processor node.
   * @readonly
   */
  get script() {
    if (!this._script) {
      this._script = this.context.audioContext.createScriptProcessor(_WebAudioNodes.BUFFER_SIZE);
      this._script.connect(this.context.destination);
    }
    return this._script;
  }
  /** Cleans up. */
  destroy() {
    super.destroy();
    this.bufferSource.disconnect();
    if (this._script) {
      this._script.disconnect();
    }
    this.gain.disconnect();
    this.analyser.disconnect();
    this.bufferSource = null;
    this._script = null;
    this.gain = null;
    this.analyser = null;
    this.context = null;
  }
  /**
   * Clones the bufferSource. Used just before playing a sound.
   * @returns {SourceClone} The clone AudioBufferSourceNode.
   */
  cloneBufferSource() {
    const orig = this.bufferSource;
    const source = this.context.audioContext.createBufferSource();
    source.buffer = orig.buffer;
    WebAudioUtils.setParamValue(source.playbackRate, orig.playbackRate.value);
    source.loop = orig.loop;
    const gain = this.context.audioContext.createGain();
    source.connect(gain);
    gain.connect(this.destination);
    return { source, gain };
  }
  /**
   * Get buffer size of `ScriptProcessorNode`.
   * @readonly
   */
  get bufferSize() {
    return this.script.bufferSize;
  }
};
let WebAudioNodes = _WebAudioNodes;
/**
 * The buffer size for script processor, default is `0` which auto-detects. If you plan to use
 * script node on iOS, you'll need to provide a non-zero amount.
 * @default 0
 */
WebAudioNodes.BUFFER_SIZE = 0;

export { WebAudioNodes };
//# sourceMappingURL=WebAudioNodes.mjs.map
