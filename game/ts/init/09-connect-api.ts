import { StartupAPI } from ".";
import { ElementalLoadingUi } from "../../../shared/elem";
import { connectApi } from "../api";
import { getActiveServer } from "../server-manager";

export async function initConnectAPI(startupAPI: StartupAPI, ui: ElementalLoadingUi) {
  const initialServer = await getActiveServer();
  await connectApi(initialServer.baseUrl, null, ui as ElementalLoadingUi)
}
