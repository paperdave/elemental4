import localForage from '../../shared/localForage';
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
import { getNextMusic, loadSounds, playMusicTrack, playSound } from './audio';
import { AlertDialog, PromptDialog } from './dialog';

declare const $production: string;
declare const $build_date: string;
declare const $password: string;

const cacheName = 'ELEMENTAL';

export let SKIPPED_UPDATES = false;

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

        window.localForage = localForage;
        window.localStorage_ = localStorage;
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
    SKIPPED_UPDATES = true;
    console.log("Could not check version, Updates Skipped.");
  }

  if('serviceWorker' in navigator) {
    ui.status('Loading Service', 0);
    const reg = await navigator.serviceWorker.register('/pwa.js?v=' + MenuAPI.cache);

    if(!await caches.has(cacheName)) {
      ui.status('Downloading Game Files', 0);
      const cache = await caches.open(cacheName)
      let count = 0;
      await Promise.all([
        '/elemental.js?v=' + MenuAPI.cache,
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
      ].map(async (url, i, a) => {
        await cache.add(url);
        count++;
        ui.status('Downloading Game Files', count/(a.length));
      }))
    }

    if(!await caches.has('monaco_editor')) {
      const monacoCache = await caches.open('monaco_editor');

      let count = 0;
      ui.status('Downloading Monaco Editor', 0);
      await Promise.all(require('../../monaco-editor-files.json').files.map(x => `/vs/${x}`)
      .map(async (url, i, a) => {
        await monacoCache.add(url);
        count++;
        ui.status('Downloading Monaco Editor', count/(a.length));
      }))
    }
  } 

  ui.status('Loading Game HTML', 0);
  const gameRoot = document.getElementById('game');
  gameRoot.innerHTML = await fetch('/game').then((x) => x.text());

  const versionInfo = {
    'version': pkg.version,
    'build-date': $build_date
  };
  document.querySelectorAll('[data-build-info]').forEach(x => x.innerHTML = versionInfo[x.getAttribute('data-build-info')]);

  if (!$production) {
    ui.status('Loading Console Vars', 0);
    require("./globals").exposeGlobals();
  }

  ui.status('Loading Servers', 0);
  await installDefaultServers();
  ui.status('Loading Servers', 0.8);
  const initialServer = await getActiveServer();
  ui.status('Loading Themes', 0);
  await MountThemeCSS();
  ui.status('Loading Settings', 0);
  await InitSettings();
  ui.status('Loading Audio', 0);
  await loadSounds();
  ui.status('Loading Element UI', 0);
  await InitElementGameUi();

  ui.status('Loading API', 0);

  try {
    await connectApi(initialServer.baseUrl, null, ui as ElementalLoadingUi)
  } catch (error) {
    await AlertDialog({ title: 'Error Connecting', text: `Failed to connect to ${initialServer.baseUrl}.` });
    setActiveServer('internal:null');
    await connectApi('internal:null', null, ui as ElementalLoadingUi)
  }
  
  'dispose' in ui && ui.dispose();

  localStorage.cache = MenuAPI.cache;

  MenuAPI.showGame && MenuAPI.showGame();

  localStorage.setItem('auto_start', 'true');
  
  await delay(10);

  document.getElementById('game').classList.add('animate-in');
  playSound('startup');
  playMusicTrack(getNextMusic());
}
async function kill() {
  
}

window['$elemental4'] = boot;
