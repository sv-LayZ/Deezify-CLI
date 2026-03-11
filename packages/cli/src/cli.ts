import { asarBackupNow } from "./utils/backup";
import { patchAsar } from "./utils/patch";

declare const INJECT_CONTENT: string;
declare const FINAL_NAME: string;

asarBackupNow();
await patchAsar({
	scriptSrc: `./${FINAL_NAME}`,
	injectContent: INJECT_CONTENT,
	injectFileName: FINAL_NAME,
});
console.log("✅ app.asar patched !");
