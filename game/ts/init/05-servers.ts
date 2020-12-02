import { StartupAPI } from ".";
import { getInstalledServers } from "../savefile";
import { allBuiltInServers, ServerEntry } from "../server-manager";
import { addDLCByUrl } from "../dlc-fetch";
import { ElementalLoadingUi } from "./loading";

export async function initServerList(startupAPI: StartupAPI, ui: ElementalLoadingUi) {
  ui.status('Loading Servers', 0);
  
  // Install All Built In Servers
  const servers = await getInstalledServers() as ServerEntry[];
  const list = allBuiltInServers.filter(x => !servers.some(y => y.baseUrl === x) && x.startsWith('https://'));
  await Promise.all(list.map(x => {
    return addDLCByUrl(x, 'server', true);
  }));

  // const initialServer = await getActiveServer();
}
