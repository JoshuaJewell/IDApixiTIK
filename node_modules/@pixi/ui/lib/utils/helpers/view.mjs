import { Sprite, Texture } from 'pixi.js';

function getView(view) {
  if (typeof view === "string") {
    return Sprite.from(view);
  }
  if (view instanceof Texture) {
    return new Sprite(view);
  }
  return view;
}

export { getView };
//# sourceMappingURL=view.mjs.map
