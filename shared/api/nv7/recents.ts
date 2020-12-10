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
    var count = 0;
    api.ref.addEventListener("put", function() {
      count++;
      if (count > 1) {
        api.ref.close();
        resolve();
      }
    });
  })
}
