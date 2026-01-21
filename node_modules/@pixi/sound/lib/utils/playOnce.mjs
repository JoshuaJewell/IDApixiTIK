import { getInstance } from '../instance.mjs';

let PLAY_ID = 0;
function playOnce(url, callback) {
  const alias = `alias${PLAY_ID++}`;
  getInstance().add(alias, {
    url,
    preload: true,
    autoPlay: true,
    loaded: (err) => {
      if (err) {
        console.error(err);
        getInstance().remove(alias);
        if (callback) {
          callback(err);
        }
      }
    },
    complete: () => {
      getInstance().remove(alias);
      if (callback) {
        callback(null);
      }
    }
  });
  return alias;
}

export { PLAY_ID, playOnce };
//# sourceMappingURL=playOnce.mjs.map
