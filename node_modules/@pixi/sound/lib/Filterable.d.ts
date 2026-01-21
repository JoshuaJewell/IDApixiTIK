import { Filter } from './filters/Filter';
/**
 * Abstract class which SoundNodes and SoundContext
 * both extend. This provides the functionality for adding
 * dynamic filters.
 */
declare class Filterable {
    /** Get the gain node */
    private _input;
    /** The destination output audio node */
    private _output;
    /** Collection of filters. */
    private _filters;
    /**
     * @param input - The source audio node
     * @param output - The output audio node
     */
    constructor(input: AudioNode, output: AudioNode);
    /** The destination output audio node */
    get destination(): AudioNode;
    /** The collection of filters. */
    get filters(): Filter[];
    set filters(filters: Filter[]);
    /** Cleans up. */
    destroy(): void;
}
export { Filterable };
