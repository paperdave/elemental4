import { createLoadingUi, ElementalLoadingUi } from "./loading";
import { initCheckForUpdates, initFinalizeUpdates, initAlertFailedUpdates } from "./01-updater";
import { initServiceWorker } from "./02-worker";
import { initDownloadGame, initDownloadSecondary } from "./03-download-data";
import { initServerList } from "./05-servers";
import { initTheme } from "./06-themes";
import { initAudio } from "./07-audio";
import { initUserInterface } from "./08-ui";
import { initConnectAPI } from "./09-connect-api";
import { initShowGame } from "./10-show-game";

export interface StartupAPI {
  cache: string;
  status?: (text: string, progress?: number) => void;
  showGame?: () => void;
  upgraded?: string
}

export async function initializeGame(startupAPI: StartupAPI) {
  // Clear the console on production so you can always look at the top of the log.
  if($production) console.clear();
  console.log(`👋 Hello Elemental, version ${$version}`);

  // Use provided UI or create a loading UI.
  const ui = (startupAPI.status ? startupAPI : createLoadingUi()) as ElementalLoadingUi;

  // Compatibility with an older version of Elemental
  if (typeof localStorage === 'undefined') return location.reload();

  // In development mode, the game exposes variables with all the imports
  if (!$production) {
    ui.status('Loading Console Vars');
    // require("./globals").exposeGlobals();
  }

  // Load the entire game.
  await initFinalizeUpdates(startupAPI, ui);
  await initServiceWorker(startupAPI, ui)
  await initCheckForUpdates(startupAPI, ui);
  await initDownloadGame(startupAPI, ui);
  await initServerList(startupAPI, ui)
  await initTheme(startupAPI, ui)
  await initAlertFailedUpdates(startupAPI, ui);
  await initAudio(startupAPI, ui)
  await initUserInterface(startupAPI, ui);
  await initConnectAPI(startupAPI, ui);
  await initShowGame(startupAPI, ui);

  // Secondary downloads in the background
  initDownloadSecondary(startupAPI, ui);
}
