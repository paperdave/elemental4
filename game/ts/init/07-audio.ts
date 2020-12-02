import { Howler } from "howler";
import { StartupAPI } from ".";
import { delay } from "../../../shared/shared";
import { loadSounds } from "../audio";
import { AlertDialog } from "../dialog";
import { ElementalLoadingUi } from "./loading";

export async function initAudio(startupAPI: StartupAPI, ui: ElementalLoadingUi) {
  ui.status('Loading Audio', 0);
  await loadSounds();

  while (Howler.ctx.state === 'suspended') {
    await AlertDialog({
      title: 'Autoplay Disabled',
      text: 'Click OK on this dialog to enable audio autoplay. [Learn More](/chrome_autoplay)',
    });
    await delay(350);
  }
}
