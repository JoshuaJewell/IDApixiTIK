import { CanvasSource } from 'pixi.js';
import { WebAudioMedia } from '../webaudio/WebAudioMedia.mjs';

function render(sound, options) {
  const canvas = document.createElement("canvas");
  options = {
    width: 512,
    height: 128,
    fill: "black",
    ...options || {}
  };
  canvas.width = options.width;
  canvas.height = options.height;
  const textureSource = new CanvasSource({
    resource: canvas
  });
  if (!(sound.media instanceof WebAudioMedia)) {
    return textureSource;
  }
  const media = sound.media;
  console.assert(!!media.buffer, "No buffer found, load first");
  const context = canvas.getContext("2d");
  context.fillStyle = options.fill;
  const data = media.buffer.getChannelData(0);
  const step = Math.ceil(data.length / options.width);
  const amp = options.height / 2;
  for (let i = 0; i < options.width; i++) {
    let min = 1;
    let max = -1;
    for (let j = 0; j < step; j++) {
      const datum = data[i * step + j];
      if (datum < min) {
        min = datum;
      }
      if (datum > max) {
        max = datum;
      }
    }
    context.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
  }
  return textureSource;
}

export { render };
//# sourceMappingURL=render.mjs.map
