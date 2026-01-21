'use strict';

class SoundSprite {
  /**
   * @param parent - The parent sound
   * @param options - Data associated with object.
   */
  constructor(parent, options) {
    this.parent = parent;
    Object.assign(this, options);
    this.duration = this.end - this.start;
    console.assert(this.duration > 0, "End time must be after start time");
  }
  /**
   * Play the sound sprite.
   * @param {Function} [complete] - Function call when complete
   * @return Sound instance being played.
   */
  play(complete) {
    return this.parent.play({
      complete,
      speed: this.speed || this.parent.speed,
      end: this.end,
      start: this.start,
      loop: this.loop
    });
  }
  /** Destroy and don't use after this */
  destroy() {
    this.parent = null;
  }
}

exports.SoundSprite = SoundSprite;
//# sourceMappingURL=SoundSprite.js.map
