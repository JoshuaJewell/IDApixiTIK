/**
 * Represents a single sound element. Can be used to play, pause, etc. sound instances.
 *
 * @memberof filters
 */
declare class Filter {
    /** The node to connect for the filter to the previous filter. */
    destination: AudioNode;
    /** The node to connect for the filter to the previous filter. */
    source: AudioNode;
    /**
     * @param {AudioNode} destination - The audio node to use as the destination for the input AudioNode
     * @param {AudioNode} [source] - Optional output node, defaults to destination node. This is useful
     *        when creating filters which contains multiple AudioNode elements chained together.
     */
    constructor(destination: AudioNode, source?: AudioNode);
    /** Reinitialize */
    protected init(destination: AudioNode, source?: AudioNode): void;
    /**
     * Connect to the destination.
     * @param {AudioNode} destination - The destination node to connect the output to
     */
    connect(destination: AudioNode): void;
    /** Completely disconnect filter from destination and source nodes. */
    disconnect(): void;
    /** Destroy the filter and don't use after this. */
    destroy(): void;
}
export { Filter };
