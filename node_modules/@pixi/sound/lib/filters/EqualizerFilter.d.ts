import { Filter } from './Filter';
/**
 * Filter for adding equalizer bands.
 *
 * @memberof filters
 */
declare class EqualizerFilter extends Filter {
    /**
     * Band at 32 Hz
     * @readonly
     */
    static readonly F32: number;
    /**
     * Band at 64 Hz
     * @readonly
     */
    static readonly F64: number;
    /**
     * Band at 125 Hz
     * @readonly
     */
    static readonly F125: number;
    /**
     * Band at 250 Hz
     * @readonly
     */
    static readonly F250: number;
    /**
     * Band at 500 Hz
     * @readonly
     */
    static readonly F500: number;
    /**
     * Band at 1000 Hz
     * @readonly
     */
    static readonly F1K: number;
    /**
     * Band at 2000 Hz
     * @readonly
     */
    static readonly F2K: number;
    /**
     * Band at 4000 Hz
     * @readonly
     */
    static readonly F4K: number;
    /**
     * Band at 8000 Hz
     * @readonly
     */
    static readonly F8K: number;
    /**
     * Band at 16000 Hz
     * @readonly
     */
    static readonly F16K: number;
    /**
     * The list of bands
     * @readonly
     */
    readonly bands: BiquadFilterNode[];
    /**
     * The map of bands to frequency
     * @readonly
     */
    readonly bandsMap: Record<number, BiquadFilterNode>;
    /**
     * @param f32 - Default gain for 32 Hz
     * @param f64 - Default gain for 64 Hz
     * @param f125 - Default gain for 125 Hz
     * @param f250 - Default gain for 250 Hz
     * @param f500 - Default gain for 500 Hz
     * @param f1k - Default gain for 1000 Hz
     * @param f2k - Default gain for 2000 Hz
     * @param f4k - Default gain for 4000 Hz
     * @param f8k - Default gain for 8000 Hz
     * @param f16k - Default gain for 16000 Hz
     */
    constructor(f32?: number, f64?: number, f125?: number, f250?: number, f500?: number, f1k?: number, f2k?: number, f4k?: number, f8k?: number, f16k?: number);
    /**
     * Set gain on a specific frequency.
     * @param frequency - The frequency, see EqualizerFilter.F* for bands
     * @param gain - Recommended -40 to 40.
     */
    setGain(frequency: number, gain?: number): void;
    /**
     * Get gain amount on a specific frequency.
     * @return The amount of gain set.
     */
    getGain(frequency: number): number;
    /**
     * Gain at 32 Hz frequencey.
     * @default 0
     */
    set f32(value: number);
    get f32(): number;
    /**
     * Gain at 64 Hz frequencey.
     * @default 0
     */
    set f64(value: number);
    get f64(): number;
    /**
     * Gain at 125 Hz frequencey.
     * @default 0
     */
    set f125(value: number);
    get f125(): number;
    /**
     * Gain at 250 Hz frequencey.
     * @default 0
     */
    set f250(value: number);
    get f250(): number;
    /**
     * Gain at 500 Hz frequencey.
     * @default 0
     */
    set f500(value: number);
    get f500(): number;
    /**
     * Gain at 1 KHz frequencey.
     * @default 0
     */
    set f1k(value: number);
    get f1k(): number;
    /**
     * Gain at 2 KHz frequencey.
     * @default 0
     */
    set f2k(value: number);
    get f2k(): number;
    /**
     * Gain at 4 KHz frequencey.
     * @default 0
     */
    set f4k(value: number);
    get f4k(): number;
    /**
     * Gain at 8 KHz frequencey.
     * @default 0
     */
    set f8k(value: number);
    get f8k(): number;
    /**
     * Gain at 16 KHz frequencey.
     * @default 0
     */
    set f16k(value: number);
    get f16k(): number;
    /** Reset all frequency bands to have gain of 0 */
    reset(): void;
    destroy(): void;
}
export { EqualizerFilter };
