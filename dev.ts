import installPath from "./packages/cli/src/utils/install-path";
import devBypass from "./packages/cli/src/utils/dev-bypass";
import envPaths from "env-paths";
import asar from "asar";
import { watch } from "fs";

const DEV_PORT = 3000;
const FINAL_NAME = "deezify.js";
const paths = envPaths("Deezify", { suffix: "" });

const htmlPatcher = new HTMLRewriter().on("head", {
	element(element) {
		element.append(`<script src="http://localhost:${DEV_PORT}/${FINAL_NAME}"></script>`, { html: true });
	},
});

async function devPatch() {
	const asarPath = await installPath();
	const extractedPath = `${paths.temp}\\app.asar`;
	asar.extractAll(asarPath, extractedPath);
	const htmlFile = await Bun.file(`${extractedPath}\\build\\index.html`).arrayBuffer();
	await Bun.write(`${extractedPath}\\build\\index.html`, htmlPatcher.transform(htmlFile));
	await devBypass(`${extractedPath}\\build`);
	await asar.createPackage(extractedPath, asarPath);
	console.log("✅ ASAR patché (mode dev) — script servi depuis localhost:" + DEV_PORT);
}

async function buildInject() {
	const result = await Bun.build({
		entrypoints: ["./packages/inject/src/main.ts"],
		target: "browser",
	});
	if (!result.success) {
		console.error("[inject] Build échoué:", result.logs);
		return null;
	}
	return await result.outputs[0]!.text();
}

let cachedContent = (await buildInject()) ?? "";

watch("./packages/inject/src", { recursive: true }, async () => {
	console.log("[inject] Changement détecté, rebuild...");
	const content = await buildInject();
	if (content !== null) {
		cachedContent = content;
		console.log("[inject] Rebuild ✅ — Ctrl+R dans Deezer pour appliquer");
	}
});

Bun.serve({
	port: DEV_PORT,
	fetch() {
		return new Response(cachedContent, {
			headers: { "Content-Type": "application/javascript" },
		});
	},
});

await devPatch();
console.log(`\n🚀 Dev prêt — http://localhost:${DEV_PORT}/${FINAL_NAME}`);
console.log("📝 Édite packages/inject/src/main.ts puis Ctrl+R dans Deezer\n");
