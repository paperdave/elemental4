import { ElementalConfig } from "../../shared/elem";
import { addDLCByUrl } from "./dlc-fetch";
import { getConfigString, getInstalledServers, setConfigString } from "./savefile";

interface ServerEntry {
  baseUrl: string,
  name: string,
  config: ElementalConfig,
}

export const builtInServers = [
  'https://main.elemental4.net',
  'https://anarchy.elemental4.net',

  // Not affiliated with Elemental 4, but I did work with these people to ensure their game works with mine.
  'https://elemental.hparcells.tk',
  // 'https://elemental5.net',
  // 'https://ledomsoft.com:3101',
].filter(Boolean) as string[];

export async function getServerList(): Promise<ServerEntry[]> {
  return await getInstalledServers() as ServerEntry[];
}
export async function installDefaultServers(): Promise<void> {
  const servers = await getInstalledServers() as ServerEntry[];
  const list = builtInServers.filter(x => !servers.some(y => y.baseUrl === x));
  await Promise.all(list.map(x => {
    return addDLCByUrl(x, 'server', true);
  }))
}

export async function setActiveServer(baseUrl: string) {
  setConfigString('server', baseUrl);
}

export async function getActiveServer() {
  const name = getConfigString('server', 'https://main.elemental4.net');
  return (await getServerList()).find(x => x.baseUrl === name) || { baseUrl: name, name: 'Unknown Server' }
}
