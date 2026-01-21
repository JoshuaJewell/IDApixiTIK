'use strict';

var pixi_js = require('pixi.js');
var instance = require('./instance.js');
var Sound = require('./Sound.js');
var supported = require('./utils/supported.js');

const getAlias = (asset) => {
  const src = asset.src;
  let alias = asset?.alias?.[0];
  if (!alias || asset.src === alias) {
    alias = pixi_js.path.basename(src, pixi_js.path.extname(src));
  }
  return alias;
};
const soundAsset = {
  extension: pixi_js.ExtensionType.Asset,
  detection: {
    test: async () => true,
    add: async (formats) => [...formats, ...supported.extensions.filter((ext) => supported.supported[ext])],
    remove: async (formats) => formats.filter((ext) => formats.includes(ext))
  },
  loader: {
    name: "sound",
    extension: {
      type: [pixi_js.ExtensionType.LoadParser],
      priority: pixi_js.LoaderParserPriority.High
    },
    /** Should we attempt to load this file? */
    test(url) {
      const ext = pixi_js.path.extname(url).slice(1);
      return !!supported.supported[ext] || supported.mimes.some((mime) => url.startsWith(`data:${mime}`));
    },
    /** Load the sound file, this is mostly handled by Sound.from() */
    async load(url, asset) {
      const sound = await new Promise((resolve, reject) => Sound.Sound.from({
        ...asset.data,
        url,
        preload: true,
        loaded(err, sound2) {
          if (err) {
            reject(err);
          } else {
            resolve(sound2);
          }
          asset.data?.loaded?.(err, sound2);
        }
      }));
      instance.getInstance().add(getAlias(asset), sound);
      return sound;
    },
    /** Remove the sound from the library */
    async unload(_sound, asset) {
      instance.getInstance().remove(getAlias(asset));
    }
  }
};
pixi_js.extensions.add(soundAsset);

exports.soundAsset = soundAsset;
//# sourceMappingURL=soundAsset.js.map
