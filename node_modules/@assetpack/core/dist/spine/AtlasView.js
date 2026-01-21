// TODO EXPORT this out! But don't want to create a dependency on the atlas plugin just yet..
export class AtlasView {
    rawAtlas;
    constructor(buffer) {
        this.rawAtlas = buffer.toString();
    }
    getTextures() {
        const regex = /^.+?(?:\.png|\.jpg|\.jpeg|\.webp|\.avif|\.dds|\.ktx)$/gm;
        const matches = this.rawAtlas.match(regex);
        return matches;
    }
    replaceTexture(filename, newFilename) {
        this.rawAtlas = this.rawAtlas.replace(filename, newFilename);
    }
    get buffer() {
        return Buffer.from(this.rawAtlas);
    }
}
//# sourceMappingURL=AtlasView.js.map