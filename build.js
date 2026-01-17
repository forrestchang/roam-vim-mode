import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const config = {
    entryPoints: ['src/extension.js'],
    bundle: true,
    outfile: 'extension.js',
    format: 'esm',
    target: 'es2020',
};

if (isWatch) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log('Watching for changes...');
} else {
    await esbuild.build(config);
    console.log('Build complete');
}
