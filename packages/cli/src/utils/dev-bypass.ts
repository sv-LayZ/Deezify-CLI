import { readdir } from "node:fs/promises";
import { join } from "node:path";

function devRewrite(jsCode: string) {
	return jsCode.replace('return"yes"===process.env.DZ_DEVTOOLS', "return true");
}

/**
 * Patch main process JS files to enable DevTools menu (Ctrl+Shift+I).
 * @param path Extracted root asar path (NOT build/)
 */
export default async function devBypass(path: string): Promise<void> {
	const entries = await readdir(path, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.isFile() && entry.name.endsWith(".js")) {
			const filePath = join(path, entry.name);
			const content = await Bun.file(filePath).text();
			const patched = devRewrite(content);
			if (patched !== content) {
				await Bun.write(filePath, patched);
			}
		}
	}
}