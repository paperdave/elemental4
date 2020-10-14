import { MountThemeCSS, resetBuiltInThemes } from './theme';
import { InitSettings } from './settings';
import { InitElementGameUi } from './element-game';
import { delay } from '../../shared/shared';
import { fetchWithProgress } from '../../shared/fetch-progress';
import { connectApi } from './api';
import { ElementalLoadingUi } from '../../shared/elem';
import { createLoadingUi } from './loading';
import * as pkg from '../../package.json';
import { getActiveServer, installDefaultServers, setActiveServer } from './server-manager';
import { asyncAlert, asyncPrompt } from './dialog';
import { loadSounds, playSound } from './audio';

declare const $production: string;
declare const $build_date: string;
declare const $password: string;

export let OFFLINE = false;

type MenuAPI = {
  cache: string;
  status?: (text: string, progress?: number) => void;
  showGame?: () => void;
  upgraded?: string
}

async function boot(MenuAPI: MenuAPI) {
  // Initial Stuff
  delete window["$elemental4"];
  console.log(`👋 Hello Elemental, version ${pkg.version}`);

  const ui = MenuAPI.status ? MenuAPI : createLoadingUi();

  if(MenuAPI.upgraded) {
    ui.status('Finalizing Updates', 0);
    if (window.navigator && navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map(x => x.unregister())));
    }
    await caches.delete('ELEMENTAL')
  }

  ui.status('Checking Updates', 0);

  // check for updates
  try {
    const latestVersion = await fetch('/version').then(x => x.text());
    if (latestVersion !== pkg.version) {
      await resetBuiltInThemes();
      const cache = latestVersion + '-' + Math.random().toFixed(6).substr(2);
      const progress = fetchWithProgress(await fetch('/elemental.js?v=' + cache));
      progress.on('progress', ({ percent, current, total }) => {
        ui.status(`Updating Client`, percent);
      });
      progress.on('done', async(text) => {
        localStorage.cache = cache;
        
        eval(text);

        // pass the current menu api / ui.
        window['$elemental4']({
          ...MenuAPI,
          ...ui,
          upgraded: pkg.version
        });
      })
      return;
    }
  } catch (error) {
    OFFLINE = true;
    console.log("Could not check version, offline mode enabled");
  }

  ui.status('Loading Game', 0);

  if (!$production) {
    require("./globals").exposeGlobals();
  }

  const versionInfo = {
    'version': pkg.version,
    'build-date': $build_date
  };
  document.querySelectorAll('[data-build-info]').forEach(x => x.innerHTML = versionInfo[x.getAttribute('data-build-info')]);

  await installDefaultServers();
  const initialServer = await getActiveServer();
  await MountThemeCSS();
  await InitSettings();
  await loadSounds();
  await InitElementGameUi();
  
  // i dont want people just getting in super ez, so this should do the trick.
  if ($password) {
    const entry = await asyncPrompt('Password Required for Beta', 'To enter in the beta, you need to know the Password.', '');

    if (entry !== $password) {
      location.reload();
      return
    }
  }

  if('serviceWorker' in navigator && $production) {
    ui.status('Registering Service', 0);

    await navigator.serviceWorker.register('/pwa.js?v=' + MenuAPI.cache);
  } 

  ui.status(OFFLINE ? 'Loading Game' : 'Connecting to Game', 0);

  try {
    await connectApi(initialServer.baseUrl, null, ui as ElementalLoadingUi)
  } catch (error) {
    await asyncAlert('Error Connecting', `Failed to connect to ${initialServer.baseUrl}, you will instead be connecting to the Elemental 4 Main Server.`);
    setActiveServer('https://main.elemental4.net');
    await connectApi('https://main.elemental4.net', null, ui as ElementalLoadingUi)
  }
  
  'dispose' in ui && ui.dispose();

  localStorage.cache = MenuAPI.cache;

  MenuAPI.showGame && MenuAPI.showGame();
  
  await delay(10);

  document.getElementById('GAME').classList.add('animate-in');
  playSound('startup');
}

window['$elemental4'] = boot;
