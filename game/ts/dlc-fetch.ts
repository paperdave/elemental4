import { AlertDialog, ConfirmDialog } from "./dialog";
import { installTheme, ThemeEntry } from "./theme";
import { connectApi, getSupportedServerTypes } from './api';
import { resolve } from 'url';
import { version } from "../../package.json";
import { installServer } from "./savefile";
import { capitalize } from "@reverse/string";
import { THEME_VERSION } from "./theme-version";
import { createLoadingUi } from "./loading";

export type DLCType = 'theme' | 'pack' | 'server';

const corsAnywhereBaseUrl = 'https://proxy.elemental4.net/';
async function fetchCorsAnywhere(url: string, options?: RequestInit) {
  try {
    return { cors: true, response: await fetch(url, options) };
  } catch (error) {
    return { cors: false, response: await fetch(corsAnywhereBaseUrl + url, options) };
  }
}

export async function addDLCByUrl(url: string, intendedType: DLCType, isBuiltIn = false): Promise<ThemeEntry | object | null> {
  if(!url) return;
  let ui: ReturnType<typeof createLoadingUi>;
  if (!isBuiltIn) {
    ui = createLoadingUi();
    ui.status('Adding DLC', 0);
  }
  let x;
  try {
    x = await addDLCByUrl2(url, intendedType, isBuiltIn);
  } catch (error) {
    if (!isBuiltIn) {
      await AlertDialog({
        title: 'Error Adding DLC',
        text: error.toString()
      });
    }
  }
  if(ui) {
    ui.dispose();
  }
  return x;
}
async function addDLCByUrl2(url: string, intendedType: DLCType, isBuiltIn = false): Promise<ThemeEntry | object | null> {
  let json, cors
  try {
    json = JSON.parse(url);
    url = location.origin + '/'
    if (json.type === 'server') {
      throw new Error("Cannot use inline JSON for a Server");
    }
  } catch (error) {
    if (!url.endsWith('.json')) {
      url += (url.endsWith('/') ? '' : '/') + 'elemental.json';
    }
    if (!url.match(/^[a-zA-Z-]+:\/\//) && !isBuiltIn) {
      if (url.startsWith('localhost')) {
        url = 'http://' + url;
      } else {
        url = 'https://' + url;
      }
    }
    try {
      const x = await fetchCorsAnywhere(url).then(async(x) => ({ cors: x.cors, response: await x.response.json() }));
      json = x.response;
      cors = x.cors;
    } catch (error) {
      if (isBuiltIn) {
        return null;
      }
      await AlertDialog({ title: 'Error Adding DLC', text: 'Could not find an elemental.json file at this URL.' });
      return null;
    }
  }
  if(!(
    typeof json === 'object'
    && json !== null
    && typeof json.type === 'string'
  )) {
    if (isBuiltIn) {
      return null;
    }
    await AlertDialog({ title: 'Error Adding DLC', text: 'Found a malformed elemental.json file' });
    return null;
  }
  
  if ((await getSupportedServerTypes()).includes(json.type)) {
    if(!(
      'name' in json
    )) {
      if (isBuiltIn) {
        return null;
      }
      await AlertDialog({ title: 'Error Adding DLC', text: 'The specified server is missing metadata.' });
      return null;
    }

    if (intendedType !== 'server' && (isBuiltIn || !await ConfirmDialog({ title: 'Not a ' + capitalize(intendedType), text: 'The url you provided points to an Elemental 4 Server, would you still like to add it?', trueButton: 'Continue' }))) {
      return null;
    }
    if (!cors) {
      if(!isBuiltIn) await AlertDialog({ title: 'Error Adding Server', text: 'This server does not have CORS Headers. Elemental 4 is not allowed to communicate with it.' })
      return null;
    }
    
    if(json.icon) {
      json.icon = resolve(url, json.icon);
    }

    await installServer(url.replace(/elemental\.json$/, ''), json);
    if(!isBuiltIn) {
      await connectApi(url.replace(/elemental\.json$/, ''), json);
    }
  } else if (json.type === 'elemental4:theme') {
    if(!(
      'format_version' in json &&
      'id' in json &&
      'name' in json &&
      'description' in json
    )) {
      if (isBuiltIn) {
        return null;
      }
      await AlertDialog({ title: 'Error Adding DLC', text: 'The specified theme is missing metadata.' });
      return null;
    }
    
    if (intendedType !== 'theme' && !await ConfirmDialog({ title: 'Not a ' + capitalize(intendedType), text: 'The url you provided points to an Elemental 4 Theme, would you still like to add it?', trueButton: 'Continue'} )) {
      return null;
    }
    if (json.format_version < THEME_VERSION && !await ConfirmDialog({ title: 'Incorrect Theme Version', text: 'This theme was made for an older version of Elemental 4, would you still like to use it.', trueButton: 'Continue'} )) {
      return null;
    }
    if (json.format_version > THEME_VERSION && !await ConfirmDialog({ title: 'Incorrect Theme Version', text: 'This theme was made for an older version of Elemental 4, would you still like to use it.', trueButton: 'Continue'} )) {
      return null;
    }

    const themeCache = await caches.open('THEME.' + json.id);
    
    if(json.styles) {
      const styles = await fetchCorsAnywhere(resolve(url, json.styles)).then(x => x.response.text());
      const styleURL = `/cache_data/${json.id}/style`;
      await themeCache.put(
        styleURL,
        new Response(new Blob([styles], { type: 'text/css' }), { status: 200 })
      );
      json.styles = styleURL;
    }
    if(json.sketch) {
      const sketch = await fetchCorsAnywhere(resolve(url, json.sketch)).then(x => x.response.text());
      const sketchURL = `/cache_data/${json.id}/sketch`;
      await themeCache.put(
        sketchURL,
        new Response(new Blob([sketch], { type: 'text/javascript' }), { status: 200 })
      );
      json.sketch = sketchURL;
    }
    if(json.icon) {
      const icon = (await fetchCorsAnywhere(resolve(url, json.icon))).response;
      const iconURL = `/cache_data/${json.id}/icon`;
      await themeCache.put(iconURL, icon.clone());
      json.icon = iconURL;
    }
    if(json.sounds) {
      const cachedSoundURLs = [];
      json.sounds = Object.fromEntries(await Promise.all(Object.keys(json.sounds).map(async(key) => {
        return [key, await Promise.all(json.sounds[key].map(async(x) => {
          const soundURL = `/cache_data/${json.id}/audio/${encodeURIComponent(x.url)}`;
          if (!cachedSoundURLs.includes(x.url)){
            const sound = (await fetchCorsAnywhere(resolve(url, x.url))).response;
            await themeCache.put(soundURL, sound.clone());
            cachedSoundURLs.push(x.url);
          }
          return {
            ...x,
            url: soundURL
          };
        }))];
      })))
    }
    if(json.music) {
      const cachedSoundURLs = [];
      json.music = await Promise.all(json.music.map(async(track) => {
        const musicURL = `/cache_data/${json.id}/audio/${encodeURIComponent(track.url)}`;
        if (!cachedSoundURLs.includes(track.url)){
          const sound = (await fetchCorsAnywhere(resolve(url, track.url))).response;
          await themeCache.put(musicURL, sound.clone());
          cachedSoundURLs.push(track.url);
        }
        return {
          ...track,
          url: musicURL
        };
      }))
    }

    json.isBuiltIn = isBuiltIn;
    if(isBuiltIn) {
      json.version = version;
    }

    await installTheme(json, true);
  } else if (json.type === 'pack') {
    if (isBuiltIn) {
      return null;
    }
    await AlertDialog({ title: 'Error Adding DLC', text: 'Singleplayer mode has not been added yet.' });
    return null;
  } else {
    if (isBuiltIn) {
      return null;
    }
    await AlertDialog({ title: 'Error Adding DLC', text: 'Don\'t know how to add server type "' + json.type + '"' });
    return null;
  }
}
