import { finalCopyPipe } from './finalCopyPipe.js';
import { mergePipeOptions } from './mergePipeOptions.js';
import { multiPipe } from './multiPipe.js';
export class PipeSystem {
    pipes = [];
    pipeHash = {};
    outputPath;
    entryPath;
    assetSettings = [];
    internalMetaData = {
        copy: 'copy',
        ignore: 'ignore',
    };
    constructor(options) {
        const pipes = [];
        for (let i = 0; i < options.pipes.length; i++) {
            const pipe = options.pipes[i];
            if (Array.isArray(pipe)) {
                pipes.push(multiPipe({ pipes: pipe }));
            }
            else {
                pipes.push(pipe);
            }
        }
        options.pipes.flat().forEach((pipe) => {
            this.pipeHash[pipe.name] = pipe;
            this.internalMetaData = {
                ...this.internalMetaData,
                ...Object.values(pipe.internalTags ?? pipe.tags ?? {}).reduce((acc, tag) => ({ ...acc, [tag]: true }), {}),
            };
        });
        this.pipes = pipes;
        this.outputPath = options.outputPath;
        this.entryPath = options.entryPath;
    }
    async transform(asset) {
        await this._transform(asset, 0);
    }
    async _transform(asset, pipeIndex = 0) {
        if (pipeIndex >= this.pipes.length) {
            return;
        }
        const pipe = this.pipes[pipeIndex];
        pipeIndex++;
        // if the asset has the copy tag on it, then the only pipe that should be run is the final copy pipe
        // this is to ensure that the asset is copied to the output directory without any other processing
        if (asset.allMetaData.copy && pipe !== finalCopyPipe) {
            await this._transform(asset, this.pipes.length - 1);
            return;
        }
        const options = mergePipeOptions(pipe, asset);
        if (options !== false && pipe.transform && pipe.test?.(asset, options)) {
            asset.transformName = pipe.name;
            asset.transformChildren = [];
            const assets = await pipe.transform(asset, options, this);
            const promises = [];
            for (const transformAsset of assets) {
                if (asset !== transformAsset) {
                    asset.addTransformChild(transformAsset);
                }
                promises.push(this._transform(transformAsset, pipeIndex)); // Await the recursive transform call
            }
            await Promise.all(promises);
        }
        else {
            await this._transform(asset, pipeIndex);
        }
    }
    async start(rootAsset) {
        for (let i = 0; i < this.pipes.length; i++) {
            const pipe = this.pipes[i];
            if (pipe.start) {
                await pipe.start(rootAsset, pipe.defaultOptions, this);
            }
        }
    }
    async finish(rootAsset) {
        for (let i = 0; i < this.pipes.length; i++) {
            const pipe = this.pipes[i];
            if (pipe.finish) {
                await pipe.finish(rootAsset, pipe.defaultOptions, this);
            }
        }
    }
    getPipe(name) {
        return this.pipeHash[name];
    }
}
//# sourceMappingURL=PipeSystem.js.map