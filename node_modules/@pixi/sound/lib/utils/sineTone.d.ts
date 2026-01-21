import { Sound } from '../Sound';
/**
 * Create a new sound for a sine wave-based tone.  **Only supported with WebAudio**
 * @memberof utils
 * @param hertz - Frequency of sound.
 * @param seconds - Duration of sound in seconds.
 * @return New sound.
 */
declare function sineTone(hertz?: number, seconds?: number): Sound;
export { sineTone };
