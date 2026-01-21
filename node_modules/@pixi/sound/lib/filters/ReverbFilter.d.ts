import { Filter } from './Filter';
/**
 * Filter for adding reverb. Refactored from
 * https://github.com/web-audio-components/simple-reverb/
 *
 * @memberof filters
 */
declare class ReverbFilter extends Filter {
    private _seconds;
    private _decay;
    private _reverse;
    /**
     * @param seconds - Seconds for reverb
     * @param decay - The decay length
     * @param reverse - Reverse reverb
     */
    constructor(seconds?: number, decay?: number, reverse?: boolean);
    /**
     * Clamp a value
     * @param value
     * @param min - Minimum value
     * @param max - Maximum value
     * @return Clamped number
     */
    private _clamp;
    /**
     * Length of reverb in seconds from 1 to 50
     * @default 3
     */
    get seconds(): number;
    set seconds(seconds: number);
    /**
     * Decay value from 0 to 100
     * @default 2
     */
    get decay(): number;
    set decay(decay: number);
    /**
     * Reverse value from 0 to 1
     * @default false
     */
    get reverse(): boolean;
    set reverse(reverse: boolean);
    /**
     * Utility function for building an impulse response
     * from the module parameters.
     */
    private _rebuild;
}
export { ReverbFilter };
