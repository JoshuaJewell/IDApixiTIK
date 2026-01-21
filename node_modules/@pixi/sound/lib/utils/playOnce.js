'use strict';

var instance = require('../instance.js');

exports.PLAY_ID = 0;
function playOnce(url, callback) {
  const alias = `alias${exports.PLAY_ID++}`;
  instance.getInstance().add(alias, {
    url,
    preload: true,
    autoPlay: true,
    loaded: (err) => {
      if (err) {
        console.error(err);
        instance.getInstance().remove(alias);
        if (callback) {
          callback(err);
        }
      }
    },
    complete: () => {
      instance.getInstance().remove(alias);
      if (callback) {
        callback(null);
      }
    }
  });
  return alias;
}

exports.playOnce = playOnce;
//# sourceMappingURL=playOnce.js.map
