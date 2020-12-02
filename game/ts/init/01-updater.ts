import { StartupAPI } from ".";
import { ElementalLoadingUi } from "../../../shared/elem";
import { fetchWithProgress } from "../../../shared/fetch-progress";
import { AlertDialog } from "../dialog";
import { resetBuiltInThemes } from "../theme";

let failedUpdateApply = false;

export async function initFinalizeUpdates(startupAPI: StartupAPI, ui: ElementalLoadingUi) {
  if (startupAPI.upgraded) {
    ui.status('Finalizing Updates', 0);
    if (window.navigator && navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map(x => x.unregister())));
    }
    await caches.delete('ELEMENTAL')
  }
}

export async function initCheckForUpdates(startupAPI: StartupAPI, ui: ElementalLoadingUi) {
  ui.status('Checking Updates', 0);
  try {
    const latestVersion = await fetch('/version').then(x => x.text());
    // Updates apply when the version differs, or in development mode.
    if (latestVersion !== $version || (!$production && !startupAPI.upgraded)) {
      // Reset the built in themes so they can be redownloaded later.
      resetBuiltInThemes();
      if(await applyUpdates(latestVersion, startupAPI, ui)) {
        return;
      }
    }
  } catch (error) {
    console.log(error);
    console.log("Could not check latest version, Updates Skipped.");
  }
}

function applyUpdates(latestVersion: string, startupAPI: StartupAPI, ui: ElementalLoadingUi) {
  return new Promise(async(resolve) => {
    const cacheKey = latestVersion + '-' + Math.random().toFixed(6).substr(2);
    const progress = fetchWithProgress(await fetch('/elemental.js?v=' + cacheKey));
    progress.on('progress', ({ percent, current, total }) => {
      ui.status(`Updating Client`, percent);
    });
    progress.on('done', async(text) => {
      localStorage.cache = cacheKey;

      if (await caches.has(cacheName)) {
        caches.delete(cacheName);
      }

      try {
        eval(text);

        // pass the current menu api / ui.
        window['$elemental4']({
          ...startupAPI,
          ...ui,
          cache: cacheKey,
          upgraded: $version
        });

        resolve(true)
      } catch (error) {
        ui.status('Error Updating', 0);
        failedUpdateApply = error;
        resolve(false);
      }
    });
  }).catch(e => {
    return false;
  });
}

export async function initAlertFailedUpdates(startupAPI: StartupAPI, ui: ElementalLoadingUi) {
  if (failedUpdateApply) {
    await AlertDialog({
      title: 'Failed to apply updates.',
      text: `You are playing a potentially outdated version of the game. Error: \`\`\`${failedUpdateApply && failedUpdateApply.stack}\`\`\``
    });
  }
}
