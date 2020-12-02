import { StartupAPI } from ".";
import { ElementalLoadingUi } from "./loading";
import { MountThemeCSS } from "../theme";

export async function initDownloadGame(startupAPI: StartupAPI, ui: ElementalLoadingUi) {
  if(!await caches.has(cacheName)) {
    ui.status('Downloading Game Files', 0);
    const cache = await caches.open(cacheName)
    let count = 0;
    await Promise.all(
      [
        ...[
          '/elemental.js?v=' + startupAPI.cache,
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
          '/manifest.json',
          '/changelog.md',
          '/chrome-bypass.mp3',
        ].map(async (url, i, a) => {
          await cache.add(url);
          count++;
          ui.status('Downloading Game Files', count/(a.length));
        }),
        MountThemeCSS()
      ]
    );
  } else {
    await MountThemeCSS();
  }
}

export async function initDownloadSecondary(startupAPI: StartupAPI, ui: ElementalLoadingUi) {

  // Compatibility with older Elemental 4
  if (await caches.has('monaco_editor')) {
    caches.delete('monaco_editor');
  }

  // Install Monaco and p5
  if(!await caches.has('secondary_cache')) {
    const monacoCache = await caches.open('secondary_cache');
  
    Promise.all(require('../../monaco-editor-files.json').files.map(x => `/vs/${x}`).concat('/p5.min.js')
      .map(async (url, i, a) => {
        await monacoCache.add(url);
      }))
  }
}
