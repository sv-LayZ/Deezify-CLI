import envPaths from "env-paths";
import installPath from "./install-path";
import devBypass from "./dev-bypass";
import asar from "asar";

const paths = envPaths("Deezify", { suffix: "" });

export async function patchAsar(options: { scriptSrc: string; injectContent?: string; injectFileName?: string }) {
	const htmlPatcher = new HTMLRewriter()
		.on("script#deezify", {
			element(element) {
				element.remove();
			},
		})
		.on("head", {
			element(element) {
				element.append(`<script id="deezify" src="${options.scriptSrc}"></script>`, { html: true });
			},
		});

	const asarPath = await installPath();
	const extractedPath = `${paths.temp}\\app.asar`;
	asar.extractAll(asarPath, extractedPath);

	if (process.env.NODE_ENV !== "production") {
		console.log(`📂 Extracted index.html: ${extractedPath}\\build\\index.html`);
	}

	const htmlFile = await Bun.file(`${extractedPath}\\build\\index.html`).arrayBuffer();
	await Bun.write(`${extractedPath}\\build\\index.html`, htmlPatcher.transform(htmlFile));

	if (options.injectContent && options.injectFileName) {
		await Bun.write(`${extractedPath}\\build\\${options.injectFileName}`, options.injectContent);
	}

	await devBypass(`${extractedPath}\\build`);
	await asar.createPackage(extractedPath, asarPath);
}
