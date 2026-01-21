import { Filter } from './Filter';
/**
 * Filter for adding adding delaynode.
 *
 * @memberof filters
 */
declare class DistortionFilter extends Filter {
    /** The Wave shape node use to distort */
    private _distortion;
    /** The amount of distoration */
    private _amount;
    /** @param amount - The amount of distoration from 0 to 1. */
    constructor(amount?: number);
    /** The amount of distortion to set. */
    set amount(value: number);
    get amount(): number;
    destroy(): void;
}
export { DistortionFilter };
