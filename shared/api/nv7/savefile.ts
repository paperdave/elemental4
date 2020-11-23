import {NV7ElementalAPI} from "./nv7";

export async function foundElement(api: NV7ElementalAPI, newElement: string): Promise<void> {
    await fetch(api.prefix + "new_found/" + api.uid + "/" + encodeURIComponent(newElement))
    return null;
}

export async function getFound(api: NV7ElementalAPI): Promise<string[]> {
  let foundResp = await fetch(api.prefix + "get_found/" + api.uid);
  let found = await foundResp.json();
  return found as string[];
}