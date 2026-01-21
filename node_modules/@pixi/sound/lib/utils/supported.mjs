const extensions = [
  "ogg",
  "oga",
  "opus",
  "m4a",
  "mp3",
  "mpeg",
  "wav",
  "aiff",
  "wma",
  "mid",
  "caf"
];
const mimes = [
  "audio/mpeg",
  "audio/ogg"
];
const supported = {};
function validateFormats(typeOverrides) {
  const overrides = {
    m4a: "audio/mp4",
    oga: "audio/ogg",
    opus: 'audio/ogg; codecs="opus"',
    caf: 'audio/x-caf; codecs="opus"',
    ...typeOverrides || {}
  };
  const audio = document.createElement("audio");
  const formats = {};
  const no = /^no$/;
  extensions.forEach((ext) => {
    const canByExt = audio.canPlayType(`audio/${ext}`).replace(no, "");
    const canByType = overrides[ext] ? audio.canPlayType(overrides[ext]).replace(no, "") : "";
    formats[ext] = !!canByExt || !!canByType;
  });
  Object.assign(supported, formats);
}
validateFormats();

export { extensions, mimes, supported, validateFormats };
//# sourceMappingURL=supported.mjs.map
