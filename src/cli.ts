import envPaths from "env-paths";
import installPath from "./utils/install-path";
import asar from "asar";
import devBypass from "utils/dev-bypass";
import { asarBackupNow } from "utils/backup";

declare const SRC_DEEZIFY: string;
declare const FINAL_NAME: string;

const paths = envPaths("Deezify", { suffix: "" });

const htmlPatcher = new HTMLRewriter().on("head", {
	element(element) {
		element.append(`<script src="./${FINAL_NAME}"></script>`, { html: true });
	},
});

async function patchAsarNow() {
	const asarPath = await installPath();
	const extractedPath = `${paths.temp}\\app.asar`;
	asar.extractAll(asarPath, extractedPath);
	const htmlFile = await Bun.file(`${extractedPath}\\build\\index.html`).arrayBuffer();
	await Bun.write(`${extractedPath}\\build\\index.html`, htmlPatcher.transform(htmlFile));
	await Bun.write(`${extractedPath}\\build\\${FINAL_NAME}`, await Bun.file(SRC_DEEZIFY).text());
	await devBypass(`${extractedPath}\\build`);
	await asar.createPackage(extractedPath, asarPath);
	console.log("✅ app.asar patched !");
}
asarBackupNow();
patchAsarNow();
