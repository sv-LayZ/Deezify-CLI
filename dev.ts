import { patchAsar } from "./packages/cli/src/utils/patch";
import { watch } from "fs";

const DEV_PORT = 3000;
const FINAL_NAME = "deezify.js";

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

await patchAsar({ scriptSrc: `http://localhost:${DEV_PORT}/${FINAL_NAME}` });
console.log(`\n🚀 Dev prêt — http://localhost:${DEV_PORT}/${FINAL_NAME}`);
console.log("📝 Édite packages/inject/src/main.ts puis Ctrl+R dans Deezer\n");
