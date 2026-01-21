'use strict';

exports.instance = void 0;
function setInstance(sound) {
  exports.instance = sound;
  return sound;
}
function getInstance() {
  return exports.instance;
}

exports.getInstance = getInstance;
exports.setInstance = setInstance;
//# sourceMappingURL=instance.js.map
