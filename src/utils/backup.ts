import envPaths from "env-paths";
import installPath from "./install-path";
import asar from "asar";

declare const FINAL_NAME: string;

const paths = envPaths("Deezify", { suffix: "" });

async function asarBackupNow() {
    const asarPath = await installPath();
    const latestAsar = await Bun.file(asarPath).arrayBuffer();
    const isPatched = asar.listPackage(asarPath).find(file => file.includes(FINAL_NAME));
    const date = new Date();
    const timestamp = `${date.getFullYear().toString().slice(2)}${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getDate().toString().padStart(2, "0")}.${date.getHours().toString().padStart(2, "0")}${date.getMinutes().toString().padStart(2, "0")}`;
    Bun.write(`${paths.data}\\${timestamp}${isPatched ? "-patched" : ""}\\app.asar`, latestAsar);
    console.log(`✅ Backup created at ${paths.data}\\${timestamp}${isPatched ? "-patched" : ""}\\app.asar`);
}