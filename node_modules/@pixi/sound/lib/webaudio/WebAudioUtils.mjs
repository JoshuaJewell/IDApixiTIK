import { getInstance } from '../instance.mjs';

class WebAudioUtils {
  /**
   * Dezippering is removed in the future Web Audio API, instead
   * we use the `setValueAtTime` method, however, this is not available
   * in all environments (e.g., Android webview), so we fallback to the `value` setter.
   * @param param - AudioNode parameter object
   * @param value - Value to set
   * @return The value set
   */
  static setParamValue(param, value) {
    if (param.setValueAtTime) {
      const context = getInstance().context;
      param.setValueAtTime(value, context.audioContext.currentTime);
    } else {
      param.value = value;
    }
    return value;
  }
}

export { WebAudioUtils };
//# sourceMappingURL=WebAudioUtils.mjs.map
