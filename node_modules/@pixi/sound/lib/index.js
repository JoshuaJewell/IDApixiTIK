'use strict';

var index = require('./filters/index.js');
var index$1 = require('./htmlaudio/index.js');
var instance = require('./instance.js');
var SoundLibrary = require('./SoundLibrary.js');
var index$2 = require('./utils/index.js');
var index$3 = require('./webaudio/index.js');
var Filterable = require('./Filterable.js');
var Filter = require('./filters/Filter.js');
var Sound = require('./Sound.js');
var soundAsset = require('./soundAsset.js');
var SoundSprite = require('./SoundSprite.js');

const sound = instance.setInstance(new SoundLibrary.SoundLibrary());

exports.filters = index;
exports.htmlaudio = index$1;
exports.SoundLibrary = SoundLibrary.SoundLibrary;
exports.utils = index$2;
exports.webaudio = index$3;
exports.Filterable = Filterable.Filterable;
exports.Filter = Filter.Filter;
exports.Sound = Sound.Sound;
exports.soundAsset = soundAsset.soundAsset;
exports.SoundSprite = SoundSprite.SoundSprite;
exports.sound = sound;
//# sourceMappingURL=index.js.map
