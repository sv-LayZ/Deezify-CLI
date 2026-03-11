declare const dzPlayer: any;

import folderIcon from "./assets/folder-icon.svg" with { type: "text" };

const fs = require("fs") as typeof import("fs");
const nodePath = require("path") as typeof import("path");
const os = require("os") as typeof import("os");

interface ExtensionManifest {
	id: string;
	name: string;
	version: string;
	description: string;
	author: string;
	homepage?: string;
	main: string;
	enabled: boolean;
}

function getExtensionsPath(): string {
	if (process.platform === "win32") return nodePath.join(process.env.APPDATA!, "Deezify", "extensions");
	if (process.platform === "darwin")
		return nodePath.join(os.homedir(), "Library", "Application Support", "Deezify", "extensions");
	return nodePath.join(
		process.env.XDG_CONFIG_HOME || nodePath.join(os.homedir(), ".config"),
		"Deezify",
		"extensions",
	);
}

function loadExtensions(): ExtensionManifest[] {
	const extPath = getExtensionsPath();
	if (!fs.existsSync(extPath)) {
		fs.mkdirSync(extPath, { recursive: true });
		return [];
	}

	const loaded: ExtensionManifest[] = [];
	for (const entry of fs.readdirSync(extPath, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const manifestFile = nodePath.join(extPath, entry.name, "manifest.json");
		if (!fs.existsSync(manifestFile)) continue;
		try {
			const manifest: ExtensionManifest = JSON.parse(fs.readFileSync(manifestFile, "utf-8"));
			if (!manifest.enabled) continue;
			const scriptPath = nodePath.join(extPath, entry.name, manifest.main);
			const script = document.createElement("script");
			script.src = `file://${scriptPath.replace(/\\/g, "/")}`;
			script.dataset.extension = manifest.id;
			document.head.appendChild(script);
			loaded.push(manifest);
		} catch (e) {
			console.error(`[Deezify] Extension "${entry.name}" failed:`, e);
		}
	}
	return loaded;
}

declare global {
	interface Window {
		DeezifyAPI: typeof DeezifyAPI;
	}
}

const DeezifyAPI = {
	Player: {
		play: () => dzPlayer.control.play(),
		pause: () => dzPlayer.control.pause(),
		isPlaying: () => dzPlayer.isPlaying(),
		getTrack: () => ({
			id: dzPlayer.getSongId(),
			title: dzPlayer.getSongTitle(),
			artist: dzPlayer.getArtistName(),
			album: dzPlayer.getAlbumTitle(),
			cover: dzPlayer.getCover(),
			duration: dzPlayer.getDuration(),
		}),
		getPosition: () => dzPlayer.getPosition(),
	},
	Queue: {
		getList: () => dzPlayer.getTrackList(),
		addNext: (tracks: any) => dzPlayer.addNextTracks(tracks),
		enqueue: (tracks: any) => dzPlayer.enqueueTracks(tracks),
	},
	Extensions: {
		list: () => loadedExtensions,
		getPath: () => getExtensionsPath(),
	},
};

window.DeezifyAPI = DeezifyAPI;

const loadedExtensions = loadExtensions();
console.log(`[Deezify] ${loadedExtensions.length} extension(s) loaded`);

function injectTopbarButton() {
	const observer = new MutationObserver(() => {
		const firstAction = document.querySelector(".topbar-action");
		if (!firstAction) return;
		if (document.getElementById("topbar-extension")) return;
		observer.disconnect();

		const wrapper = document.createElement("div");
		wrapper.className = "popper-wrapper topbar-action";
		wrapper.innerHTML = `<button class="chakra-button css-vmkj29" id="topbar-extension">${folderIcon}</button>`;
		firstAction.after(wrapper);
	});
	observer.observe(document.body, { childList: true, subtree: true });
}

injectTopbarButton();
