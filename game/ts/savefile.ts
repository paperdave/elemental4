import { ElementalBaseAPI, SaveFileAPI, getSubAPI, ServerSavefileEntry } from '../../shared/elem';
import { debounce } from '@reverse/debounce';
import { Store } from '../../shared/store';
import localForage from 'localforage';
import { escapeHTML } from '../../shared/shared';
import { connectApi } from './api';
import { builtInServers } from './server-manager';

const data = new Store('data');
const themes = new Store('theme_data');
const activeSavefileCache: Record<string, string> = {};

export function removeUrlSuffix(url: string) {
  return url.replace(/\/(elemental\.json)?$/, '');
}
export async function getInstalledThemes() {
  return await Promise.all((await themes.keys()).map(x => themes.get(x)))
}
export function installThemes(theme: any) {
  return themes.set(theme.id, theme);
}
export function uninstallThemes(id) {
  return themes.del(id);
}
export async function getStatistics(api: ElementalBaseAPI): Promise<any> {
  const saveFileName = await getActiveSaveFile(api);
  return data.get('stats:' + saveFileName + ':' + processBaseUrl(api.baseUrl))
}
export async function setStatistics(api: ElementalBaseAPI, stats: any): Promise<void> {
  const saveFileName = await getActiveSaveFile(api);
  return data.set('stats:' + saveFileName + ':' + processBaseUrl(api.baseUrl), stats);
}

export async function getInstalledServers() {
  return (await data.get('servers'))|| [];
}
export async function installServer(baseUrl: string, config: any) {
  baseUrl = removeUrlSuffix(baseUrl);
  const servers = (await data.get('servers') || []) as any;
  const f = servers.find(x => x.baseUrl === baseUrl)
  const name = config && config.name;
  if(f) {
    f.config = config;
    f.name = config.name;
  } else {
    servers.push({ baseUrl, name, config });
  }
  await data.set('servers', servers);

  const serverSelect = document.querySelector('#change-server') as HTMLSelectElement;
  serverSelect.querySelectorAll('*:not(:first-child)').forEach((x) => {
    x.remove();
  })
  servers.forEach((server) => {
    const option = document.createElement('option');
    option.value = server.baseUrl;
    option.innerHTML = escapeHTML(`${server.name} - ${processBaseUrl(server.baseUrl)}`);
    serverSelect.appendChild(option);
  });
  serverSelect.value = 'internal:change-btn';
}
export async function getServer(baseUrl: string) {
  baseUrl = removeUrlSuffix(baseUrl);
  const servers = (await data.get('servers') || []) as any;
  return servers.find(x => x.baseUrl === baseUrl)
}
export async function uninstallServer(baseUrl: string) {
  baseUrl = removeUrlSuffix(baseUrl);
  const servers = (await data.get('servers') || []) as any;
  const server = await getServer(baseUrl);
  await data.set('servers', servers.filter(x => x.baseUrl !== baseUrl));

  await connectApi(builtInServers[0], null);

  await data.del('config:' + processBaseUrl(baseUrl));
  const ending = ':' + processBaseUrl(baseUrl);
  await Promise.all((await data.keys()).map((key) => {
    if(key.endsWith(ending)) return data.del(key);
  }).filter(Boolean))

  const opts = { name: 'ELEMENTAL', storeName: server.config.type + ':' + processBaseUrl(baseUrl) };
  console.log(opts);
  await localForage.createInstance({...opts}).dropInstance({...opts});
}

export async function resetAllThemes() {
  await themes.clear();
  const keys = await caches.keys()
  await Promise.all(keys.map(function(key) {
    if (key.startsWith('THEME.')) {
      return caches.delete(key);
    }
  }));
}
export async function resetAllElements(api: ElementalBaseAPI) {
  const saveFileName = await getActiveSaveFile(api);
  return data.del('savefile:' + saveFileName + ':' + processBaseUrl(api.baseUrl));
}
export function processBaseUrl(url: string) {
  return url.replace(/^.*?:\/\//, '').replace(/\/(elemental\.json)?$/, '');;
}
const saveFileCache: Record<string, Set<string>> = {};
export async function getOwnedElements(api: ElementalBaseAPI) {
  const url = processBaseUrl(api.baseUrl);
  const saveFileName = await getActiveSaveFile(api);
  if(!saveFileCache[saveFileName + ':' + url]) {
    const storage = await data.get('savefile:' + saveFileName + ':' + url) as string[];
    if (storage) {
      saveFileCache[saveFileName + ':' + url] = new Set(storage);
    } else {
      saveFileCache[saveFileName + ':' + url] = new Set(await api.getStartingInventory());
    }
  }
  return [...saveFileCache[saveFileName + ':' + url]]
}
export async function setElementAsOwned(api: ElementalBaseAPI, id: string) {
  const saveFileName = await getActiveSaveFile(api);
  const url = processBaseUrl(api.baseUrl);
  await getOwnedElements(api);
  saveFileCache[saveFileName + ':' + url].add(id);
  await data.set('savefile:' + saveFileName + ':' + url, [...saveFileCache[saveFileName + ':' + url]]);
}

export async function getAPISaveFiles(api: ElementalBaseAPI): Promise<ServerSavefileEntry[]> {
  const saveFileApi = getSubAPI(api, 'serverSaveFile');
  if (saveFileApi) {
    return saveFileApi.getSaveFiles();
  } else {
    return await data.get('savefile_list:' + processBaseUrl(api.baseUrl)) as ServerSavefileEntry[] || [{ id: 'main', name: 'Main Save' }];
  }
}
export function canCreateSaveFile(api: ElementalBaseAPI, name: string): boolean {
  if(name.length > 16) return false;
  const saveFileApi = getSubAPI(api, 'serverSaveFile');
  if (saveFileApi) {
    return saveFileApi.canCreateSaveFile(name);
  } else {
    return true;
  }
}
export async function createNewSaveFile(api: ElementalBaseAPI, name: string): Promise<string> {
  const saveFileApi = getSubAPI(api, 'serverSaveFile');
  if (saveFileApi) {
    return saveFileApi.createNewSaveFile(name);
  } else {
    const saves = await data.get('savefile_list:' + processBaseUrl(api.baseUrl)) as ServerSavefileEntry[] || [{ id: 'main', name: 'Main Save' }];
    const id = Math.random().toString().slice(2,10);
    saves.push({ id, name });
    await data.set('savefile_list:' + processBaseUrl(api.baseUrl), saves);
    return id;
  }
}
export function canRenameSaveFile(api: ElementalBaseAPI, id: string, name: string): boolean {
  if(name.length > 16) return false;
  const saveFileApi = getSubAPI(api, 'serverSaveFile');
  if (saveFileApi) {
    return saveFileApi.canRenameSaveFile(id, name);
  } else {
    return true;
  }
}
export async function renameSaveFile(api: ElementalBaseAPI, id: string, name: string): Promise<boolean> {
  const saveFileApi = getSubAPI(api, 'serverSaveFile');
  if (saveFileApi) {
    return saveFileApi.renameSaveFile(id, name);
  } else {
    const saves = await data.get('savefile_list:' + processBaseUrl(api.baseUrl)) as ServerSavefileEntry[] || [{ id: 'main', name: 'Main Save' }];
    const find = saves.find(x => x.id === id)
    if (find) {
      find.name = name;
    }
    await data.set('savefile_list:' + processBaseUrl(api.baseUrl), saves);
    return true;
  }
}
export function canDeleteSaveFile(api: ElementalBaseAPI, id: string): boolean {
  if((document.querySelector('#change-savefile') as HTMLSelectElement).options.length === 1) return false;
  const saveFileApi = getSubAPI(api, 'serverSaveFile');
  if (saveFileApi) {
    return saveFileApi.canDeleteSaveFile(id);
  } else {
    return true;
  }
}
export async function deleteSaveFile(api: ElementalBaseAPI, id: string): Promise<boolean> {
  const saveFileApi = getSubAPI(api, 'serverSaveFile');
  if (saveFileApi) {
    return saveFileApi.deleteSaveFile(id);
  } else {
    const saves = await data.get('savefile_list:' + processBaseUrl(api.baseUrl)) as ServerSavefileEntry[] || [{ id: 'main', name: 'Main Save' }];
    await data.set('savefile_list:' + processBaseUrl(api.baseUrl), saves.filter(x => x.id !== id));
    return true;
  }
}
export async function getActiveSaveFile(api: ElementalBaseAPI): Promise<string> {
  if(!activeSavefileCache[api.baseUrl]) {
    activeSavefileCache[api.baseUrl] = await data.get('savefile_name:' + processBaseUrl(api.baseUrl)) || 'main';
  }
  return activeSavefileCache[api.baseUrl]
}
export async function setActiveSaveFile(api: ElementalBaseAPI, id: string): Promise<void> {
  activeSavefileCache[api.baseUrl] = id;
  await data.set('savefile_name:' + processBaseUrl(api.baseUrl), id);
}

export async function getAPISaveFile(baseUrl: string): Promise<SaveFileAPI> {
  const x = (await data.get('config:' + processBaseUrl(baseUrl)) || {}) as object;

  const write = debounce(() => {
    data.set('config:' + processBaseUrl(baseUrl), x);
  }, 1000);

  return {
    get: (k, def) => { return k in x ? x[k] : def },
    set: (k, v) => { x[k] = v; write(); }
  }
}

// game config
let cache = {};
export function getConfigBoolean(name: string, def: boolean) {
  if (name in cache) return cache[name];
  const v = localStorage['config-' + name];
  cache[name] = v === undefined ? def : v === 'true';
  return cache[name];
}
export function setConfigBoolean(name: string, value: boolean) {
  cache[name] = value;
  localStorage['config-' + name] = value.toString();
}
export function getConfigString(name: string, def: string) {
  if (name in cache) return cache[name];
  const v = localStorage['config-' + name];
  cache[name] = v === undefined ? def : v;
  return cache[name];
}
export function setConfigString(name: string, value: string) {
  cache[name] = value;
  localStorage['config-' + name] = value;
}
