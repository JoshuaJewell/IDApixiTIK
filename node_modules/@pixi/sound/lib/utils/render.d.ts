import { TextureSource } from 'pixi.js';
import { Sound } from '../Sound';
interface RenderOptions {
    /**
     * Width of the render.
     * @default 512
     */
    width?: number;
    /**
     * Height of the render.
     * @default 128
     */
    height?: number;
    /**
     * Fill style for waveform.
     * @default 'black'
     */
    fill?: string | CanvasPattern | CanvasGradient;
}
/**
 * Render image as Texture. **Only supported with WebAudio**
 * @memberof utils
 * @param sound - Instance of sound to render
 * @param options - Custom rendering options
 * @return Result texture
 */
declare function render(sound: Sound, options?: RenderOptions): TextureSource;
export { render };
export type { RenderOptions };
