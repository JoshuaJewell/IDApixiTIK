import { Filter } from './Filter';
/**
 * Combine all channels into mono channel.
 *
 * @memberof filters
 */
declare class MonoFilter extends Filter {
    /** Merger node */
    private _merger;
    constructor();
    destroy(): void;
}
export { MonoFilter };
