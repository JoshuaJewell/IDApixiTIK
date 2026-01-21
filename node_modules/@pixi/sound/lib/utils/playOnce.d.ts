/**
 * Increment the alias for play once
 * @static
 * @default 0
 */
declare let PLAY_ID: number;
/**
 * Create a new "Audio" stream based on given audio path and project uri; returns the audio object.
 * @memberof utils
 * @param url - Full path of the file to play.
 * @param {Function} callback - Callback when complete.
 * @return New audio element alias.
 */
declare function playOnce(url: string, callback?: (err?: Error) => void): string;
export { PLAY_ID, playOnce };
