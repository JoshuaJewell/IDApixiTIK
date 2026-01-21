/**
 * Internal class for Web Audio abstractions and convenience methods.
 * @memberof webaudio
 */
declare class WebAudioUtils {
    /**
     * Dezippering is removed in the future Web Audio API, instead
     * we use the `setValueAtTime` method, however, this is not available
     * in all environments (e.g., Android webview), so we fallback to the `value` setter.
     * @param param - AudioNode parameter object
     * @param value - Value to set
     * @return The value set
     */
    static setParamValue(param: AudioParam, value: number): number;
}
export { WebAudioUtils };
