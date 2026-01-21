import { Filter } from './Filter';
/**
 * Filter for adding Stereo panning.
 *
 * @memberof filters
 */
declare class StereoFilter extends Filter {
    /** The stereo panning node */
    private _stereo;
    /** The stereo panning node */
    private _panner;
    /** The amount of panning, -1 is left, 1 is right, 0 is centered */
    private _pan;
    /** @param pan - The amount of panning, -1 is left, 1 is right, 0 is centered. */
    constructor(pan?: number);
    /** Set the amount of panning, where -1 is left, 1 is right, and 0 is centered */
    set pan(value: number);
    get pan(): number;
    destroy(): void;
}
export { StereoFilter };
