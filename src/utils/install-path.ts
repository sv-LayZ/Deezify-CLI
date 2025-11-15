function getPossibleInstallPaths() {
	if (Bun.env.OS === "Windows_NT") return [`${Bun.env.LOCALAPPDATA}\\Programs\\deezer-desktop`];
	throw new Error("Not implemented for this OS yet");
}

export default async function installPath() {
	const relativeAsarPath = "\\resources\\app.asar";
	const possiblePaths = getPossibleInstallPaths();
	for (const path of possiblePaths) {
		const fullPath = path.concat(relativeAsarPath);
		if (await Bun.file(fullPath).exists()) {
			return fullPath;
		}
	}
	throw new Error("Deezer installation not found");
}
