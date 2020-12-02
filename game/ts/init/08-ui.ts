import { StartupAPI } from ".";
import { ElementalLoadingUi } from "../../../shared/elem";
import { InitElementGameUi } from "../element-game";
import { InitSettings } from "../settings/settings";

export async function initUserInterface(startupAPI: StartupAPI, ui: ElementalLoadingUi) {
  ui.status('Loading Settings', 0);
  await InitSettings();
  ui.status('Loading Engine', 0);
  await InitElementGameUi();
}
