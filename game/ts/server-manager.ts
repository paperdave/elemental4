import { ElementalConfig } from "../../shared/elem";
import { addDLCByUrl } from "./dlc-fetch";
import { getConfigString, getInstalledServers, setConfigString } from "./savefile";

interface ServerEntry {
  baseUrl: string,
  name: string,
  config: ElementalConfig,
}

export const builtInOfficialServers = [
  'http://localhost:8001',
  // 'https://main.elemental4.net',
  // 'https://anarchy.elemental4.net',
  'internal:singleplayer',
];
export const builtInThirdPartyServers = [
  // 'https://elemental.hparcells.tk',
  // 'https://dev.elemental5.net/api',
  // 'https://e4api.ledomsoft.com',
];
export const allBuiltInServers = [
  ...builtInOfficialServers,
  ...builtInThirdPartyServers
]

export async function getServerList(): Promise<ServerEntry[]> {
  return await getInstalledServers() as ServerEntry[];
}
export async function installDefaultServers(): Promise<void> {
  const servers = await getInstalledServers() as ServerEntry[];
  const list = allBuiltInServers.filter(x => !servers.some(y => y.baseUrl === x) && x.startsWith('https://'));
  await Promise.all(list.map(x => {
    return addDLCByUrl(x, 'server', true);
  }))
}

export async function setActiveServer(baseUrl: string) {
  setConfigString('server', baseUrl);
}

export async function getActiveServer() {
  const name = getConfigString('server', allBuiltInServers[0]);
  return (await getServerList()).find(x => x.baseUrl === name) || { baseUrl: name, name: 'Unknown Server' }
}
