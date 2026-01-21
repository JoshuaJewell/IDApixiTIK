'use strict';

var pixi_js = require('pixi.js');

function getView(view) {
  if (typeof view === "string") {
    return pixi_js.Sprite.from(view);
  }
  if (view instanceof pixi_js.Texture) {
    return new pixi_js.Sprite(view);
  }
  return view;
}

exports.getView = getView;
//# sourceMappingURL=view.js.map
