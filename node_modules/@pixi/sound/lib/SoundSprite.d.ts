import { IMediaInstance } from './interfaces';
import { CompleteCallback, Sound } from './Sound';
/** Data for adding new sound sprites. */
interface SoundSpriteData {
    /** The start time in seconds. */
    start: number;
    /** The end time in seconds. */
    end: number;
    /** The optional speed, if not speed, uses the default speed of the parent. */
    speed?: number;
}
type SoundSprites = Record<string, SoundSprite>;
/**
 * Object that represents a single Sound's sprite. To add sound sprites
 * use the {@link Sound#addSprites} method.
 * @example
 * import { sound } from '@pixi/sound';
 * sound.add('alias', {
 *   url: 'path/to/file.ogg',
 *   sprites: {
 *     blast: { start: 0, end: 0.2 },
 *     boom: { start: 0.3, end: 0.5 },
 *   },
 *   loaded() {
 *     sound.play('alias', 'blast');
 *   }
 * );
 *
 */
declare class SoundSprite {
    /**
     * The reference sound
     * @readonly
     */
    parent: Sound;
    /**
     * The starting location in seconds.
     * @readonly
     */
    start: number;
    /**
     * The ending location in seconds
     * @readonly
     */
    end: number;
    /**
     * The speed override where 1 is 100% speed playback.
     * @readonly
     */
    speed: number;
    /**
     * The duration of the sound in seconds.
     * @readonly
     */
    duration: number;
    /**
     * Whether to loop the sound sprite.
     * @readonly
     */
    loop: boolean;
    /**
     * @param parent - The parent sound
     * @param options - Data associated with object.
     */
    constructor(parent: Sound, options: SoundSpriteData);
    /**
     * Play the sound sprite.
     * @param {Function} [complete] - Function call when complete
     * @return Sound instance being played.
     */
    play(complete?: CompleteCallback): IMediaInstance | Promise<IMediaInstance>;
    /** Destroy and don't use after this */
    destroy(): void;
}
export type { SoundSpriteData, SoundSprites };
export { SoundSprite };
