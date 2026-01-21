import { Filter } from './Filter';
/**
 * Export a MediaStream to be recorded
 *
 * @memberof filters
 */
declare class StreamFilter extends Filter {
    private _stream;
    constructor();
    get stream(): MediaStream;
    destroy(): void;
}
export { StreamFilter };
