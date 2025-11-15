import { build } from 'bun';
import { mkdir, exists } from "node:fs/promises";

if (!await exists('./dist')) {
  await mkdir('./dist', { recursive: true });
}

await build({
  entrypoints: ['./src/cli.ts'],
  outdir: './dist',
  target: 'bun',
  naming: '[dir]/cli.js',
  define: {
    SRC_DEEZIFY: "./deezify.js",
    FINAL_NAME: "deezify.js",
  },
  minify: false,
});

await build({
  entrypoints: ['./src/inject/main.ts'],
  outdir: './dist',
  target: 'browser',
  naming: '[dir]/deezify.js',
  minify: true,
});

console.log('✅ Build finished !');