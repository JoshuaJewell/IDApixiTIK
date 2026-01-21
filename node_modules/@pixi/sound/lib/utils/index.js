'use strict';

var playOnce = require('./playOnce.js');
var render = require('./render.js');
var sineTone = require('./sineTone.js');
var supported = require('./supported.js');



Object.defineProperty(exports, 'PLAY_ID', {
	enumerable: true,
	get: function () { return playOnce.PLAY_ID; }
});
exports.playOnce = playOnce.playOnce;
exports.render = render.render;
exports.sineTone = sineTone.sineTone;
exports.extensions = supported.extensions;
exports.mimes = supported.mimes;
exports.supported = supported.supported;
exports.validateFormats = supported.validateFormats;
//# sourceMappingURL=index.js.map
