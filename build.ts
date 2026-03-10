import { build } from 'bun';

// 1. Compile le script injecté (browser, minifié) en mémoire
const injectResult = await build({
	entrypoints: ['./packages/inject/src/main.ts'],
	target: 'browser',
	minify: true,
});

if (!injectResult.success) {
	console.error('Inject build failed:', injectResult.logs);
	process.exit(1);
}

const injectContent = await injectResult.outputs[0]!.text();

// 2. Compile le CLI en embarquant le contenu du script injecté
const cliResult = await build({
	entrypoints: ['./packages/cli/src/cli.ts'],
	outdir: './packages/cli/dist',
	target: 'bun',
	naming: '[dir]/cli.js',
	define: {
		INJECT_CONTENT: JSON.stringify(injectContent),
		FINAL_NAME: JSON.stringify('deezify.js'),
	},
	minify: false,
});

if (!cliResult.success) {
	console.error('CLI build failed:', cliResult.logs);
	process.exit(1);
}

console.log('✅ Build finished !');
