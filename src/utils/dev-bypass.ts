import { readdir } from "node:fs/promises";
import { join } from "node:path";

function devRewrite(jsCode: string) {
	return jsCode.replace('return"yes"===process.env.DZ_DEVTOOLS', "return true");
}

/**
 * Change javascript file to enable the developer mode.
 * @param path Extracted build asar path
 */
export default async function devBypass(path: string): Promise<void> {
	const entries = await readdir(path, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.isFile() && entry.name.endsWith(".js")) {
			Bun.write(join(path, entry.name), devRewrite(await Bun.file(join(path, entry.name)).text()));
		}
	}
}
