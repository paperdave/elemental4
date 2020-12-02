import { StartupAPI } from ".";
import { ElementalLoadingUi } from "./loading";
import { showThemeAddDialog, updateMountedCss } from "../theme";

export async function initTheme(startupAPI: StartupAPI, ui: ElementalLoadingUi) {
  ui.status('Loading Themes', 0);
  await updateMountedCss();
  await showThemeAddDialog();
}
