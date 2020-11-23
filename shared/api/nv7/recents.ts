import {RecentCombination} from "../../elem";
import { NV7ElementalAPI } from "./nv7";

export async function getRecents(api: NV7ElementalAPI): Promise<RecentCombination[]> {
  let resp = await fetch(api.prefix + "recents")
  let data = await resp.json();
  for (var i = 0; i < data.length; i++) {
    data[i].recipe = data[i].Recipe;
    data[i].result = data[i].Result;
  }
  return data as RecentCombination[];
}

export async function waitForNew(api: NV7ElementalAPI): Promise<void> {
  api.ref = new EventSource(api.config.databaseURL + "/recent.json");
  return new Promise<void>((resolve, _) => {
    api.ref.onmessage = function() {
      api.ref.close();
      resolve();
    }
  })
}