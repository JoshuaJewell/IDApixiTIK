type ExtensionMap = Record<string, boolean>;
/**
 * The list of extensions that can be played. This is the preferred order of playback.
 * If you want to priority the order of playback, you can use this array to do so.
 * @readonly
 * @memberof utils
 */
declare const extensions: string[];
declare const mimes: string[];
/**
 * The list of browser supported audio formats.
 * @readonly
 * @memberof utils
 * @property {boolean} mp3 - `true` if file-type is supported
 * @property {boolean} ogg - `true` if file-type is supported
 * @property {boolean} oga - `true` if file-type is supported
 * @property {boolean} opus - `true` if file-type is supported
 * @property {boolean} mpeg - `true` if file-type is supported
 * @property {boolean} wav - `true` if file-type is supported
 * @property {boolean} aiff - `true` if file-type is supported
 * @property {boolean} wma - `true` if file-type is supported
 * @property {boolean} mid - `true` if file-type is supported
 * @property {boolean} caf - `true` if file-type is supported. Note that for this we check if the
 *                             'opus' codec is supported inside the caf container.
 */
declare const supported: ExtensionMap;
/**
 * Function to validate file type formats. This is called when the library initializes, but can
 * be called again if you need to recognize a format not listed in `utils.extensions` at
 * initialization.
 * @memberof utils
 * @param typeOverrides - - Dictionary of type overrides (inputs for
 *                                 AudioElement.canPlayType()), keyed by extension from the
 *                                 utils.extensions array.
 */
declare function validateFormats(typeOverrides?: Record<string, string>): void;
export { extensions, mimes, supported, validateFormats, };
