import { mergePipeOptions } from './mergePipeOptions.js';
let nameIndex = 0;
export function multiPipe(options) {
    const pipes = options.pipes.slice();
    return {
        name: options.name ?? `multi-pipe-${++nameIndex}`,
        folder: false,
        defaultOptions: options,
        test(asset) {
            for (let i = 0; i < pipes.length; i++) {
                const pipe = pipes[i];
                const options = mergePipeOptions(pipe, asset);
                if (options !== false && pipe.transform && pipe.test?.(asset, options)) {
                    return true;
                }
            }
            return false;
        },
        async start(asset, _options, pipeSystem) {
            for (let i = 0; i < pipes.length; i++) {
                const pipe = pipes[i];
                const options = mergePipeOptions(pipe, asset);
                if (options !== false && pipe.start) {
                    await pipe.start(asset, options, pipeSystem);
                }
            }
        },
        async transform(asset, _options, pipeSystem) {
            const promises = [];
            for (let i = 0; i < pipes.length; i++) {
                const pipe = pipes[i];
                const options = mergePipeOptions(pipe, asset);
                if (options !== false && pipe.transform && pipe.test?.(asset, options)) {
                    promises.push(pipe.transform(asset, options, pipeSystem));
                }
            }
            const allAssets = await Promise.all(promises);
            return allAssets.flat();
        },
        async finish(asset, _options, pipeSystem) {
            for (let i = 0; i < pipes.length; i++) {
                const pipe = pipes[i];
                const options = mergePipeOptions(pipe, asset);
                if (options !== false && pipe.finish) {
                    await pipe.finish(asset, options, pipeSystem);
                }
            }
        },
    };
}
//# sourceMappingURL=multiPipe.js.map