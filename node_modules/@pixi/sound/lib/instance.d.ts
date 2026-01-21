import { SoundLibrary } from './SoundLibrary';
/**
 * Singleton instance of the SoundLibrary
 */
declare let instance: SoundLibrary;
/**
 * Internal set function for the singleton instance.
 * @ignore
 * @param sound - - Sound library instance
 */
declare function setInstance(sound: SoundLibrary): SoundLibrary;
/**
 * Internal get function for the singleton instance.
 * @ignore
 */
declare function getInstance(): SoundLibrary;
export { getInstance, instance, setInstance };
