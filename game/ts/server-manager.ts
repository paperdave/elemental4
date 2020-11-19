import { ElementalConfig } from "../../shared/elem";
import { addDLCByUrl } from "./dlc-fetch";
import { getConfigString, getInstalledServers, setConfigString } from "./savefile";

interface ServerEntry {
  baseUrl: string,
  name: string,
  config: ElementalConfig,
}

export const builtInOfficialServers = [
  'https://main.elemental4.net',
  'https://anarchy.elemental4.net',
  // 'https://infinity.elemental4.net', // wonder what that is ;)
];
export const builtInInternalServers = [
  // 'internal:singleplayer',
];
export const builtInDevInternalServers = [
  'internal:null',
  'internal:all-colors',
  'internal:stress-test-1k',
  'internal:stress-test-5k',
  'internal:stress-test-10k',
];
export const builtInThirdPartyServers = [
  'https://elemental-reborn.tk',      // cannot suggest, need google auth
  'https://dev.elemental5.net/api',   // cannot suggest, uses a very different system
  // 'https://e4api.ledomsoft.com',   // api isn't written
  'https://nv7haven.tk',              // api is working
];
export const allBuiltInServers = [
  ...builtInOfficialServers,
  ...builtInThirdPartyServers
];
export const serverOrder = [
  ...builtInInternalServers,
  ...builtInOfficialServers,
  ...builtInDevInternalServers,
  ...builtInThirdPartyServers,
];

export async function getServerList(): Promise<ServerEntry[]> {
  return await getInstalledServers() as ServerEntry[];
}
export async function installDefaultServers(): Promise<void> {
  const servers = await getInstalledServers() as ServerEntry[];
  const list = allBuiltInServers.filter(x => !servers.some(y => y.baseUrl === x) && x.startsWith('https://'));
  await Promise.all(list.map(x => {
    return addDLCByUrl(x, 'server', true);
  }));
}

export async function setActiveServer(baseUrl: string) {
  setConfigString('server', baseUrl);
}

export async function getActiveServer() {
  const name = getConfigString('server', allBuiltInServers[0]);
  return (await getServerList()).find(x => x.baseUrl === name) || { baseUrl: name, name: 'Unknown Server' }
}
