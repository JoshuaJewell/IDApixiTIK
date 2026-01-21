'use strict';

class Filterable {
  /**
   * @param input - The source audio node
   * @param output - The output audio node
   */
  constructor(input, output) {
    this._output = output;
    this._input = input;
  }
  /** The destination output audio node */
  get destination() {
    return this._input;
  }
  /** The collection of filters. */
  get filters() {
    return this._filters;
  }
  set filters(filters) {
    if (this._filters) {
      this._filters.forEach((filter) => {
        if (filter) {
          filter.disconnect();
        }
      });
      this._filters = null;
      this._input.connect(this._output);
    }
    if (filters && filters.length) {
      this._filters = filters.slice(0);
      this._input.disconnect();
      let prevFilter = null;
      filters.forEach((filter) => {
        if (prevFilter === null) {
          this._input.connect(filter.destination);
        } else {
          prevFilter.connect(filter.destination);
        }
        prevFilter = filter;
      });
      prevFilter.connect(this._output);
    }
  }
  /** Cleans up. */
  destroy() {
    this.filters = null;
    this._input = null;
    this._output = null;
  }
}

exports.Filterable = Filterable;
//# sourceMappingURL=Filterable.js.map
