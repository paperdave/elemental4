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

const cacheName = 'ELEMENTAL';

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
    if (latestVersion !== pkg.version || (!$production && !MenuAPI.upgraded)) {
      await resetBuiltInThemes();
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

        eval(text);

        // pass the current menu api / ui.
        window['$elemental4']({
          ...MenuAPI,
          ...ui,
          cache: cacheKey,
          upgraded: pkg.version
        });
      })
      return;
    }
  } catch (error) {
    OFFLINE = true;
    console.log("Could not check version, offline mode enabled");
  }

  if('serviceWorker' in navigator) {
    ui.status('Registering Service', 0);
    const reg = await navigator.serviceWorker.register('/pwa.js?v=' + MenuAPI.cache);

    ui.status('Caching Game Files', 0);

    if(!await caches.has(cacheName)) {
      const cache = await caches.open(cacheName)
      await cache.addAll([
        '/',
        '/logo.svg',
        '/air.svg',
        '/earth.svg',
        '/fire.svg',
        '/water.svg',
        '/logo-workshop.svg',
        '/no-element.svg',
        '/game',
        '/font.css',
        '/icon/maskable.png',
        '/icon/normal.png',
        '/developer.png',
        '/theme.schema.json',
        '/p5_background',
        '/theme_editor',
        '/p5.min.js',
        '/manifest.json',
        '/elemental.js?v=' + MenuAPI.cache
      ]);
    }

    if(!await caches.has('monaco_editor')) {
      const monacoCache = await caches.open('monaco_editor');
      await monacoCache.addAll(require('../../monaco-editor-files.json').files.map(x => `/vs/${x}`));
    }
  } 

  ui.status('Loading Game HTML', 0);

  const gameRoot = document.getElementById('game');
  gameRoot.innerHTML = await fetch('/game').then((x) => x.text());

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

  // i don't want people just getting in super ez, so this should do the trick.
  if ($password) {
    const entry = await asyncPrompt('Password Required for Beta', 'To enter in the beta, you need to know the Password.', '');

    if (entry !== $password) {
      location.reload();
      return
    }
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

  document.getElementById('game').classList.add('animate-in');
  playSound('startup');
}

window['$elemental4'] = boot;
