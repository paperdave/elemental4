import {NV7ElementalAPI} from "./nv7";

export async function foundElement(api: NV7ElementalAPI, newElement: string): Promise<void> {
  if (await api.cache.isNotFound(newElement)) {
    await fetch(api.prefix + "new_found/" + api.uid + "/" + encodeURIComponent(newElement))
    await api.cache.saveFound([newElement]);
  }
}
export async function getFound(api: NV7ElementalAPI): Promise<string[]> {
  let foundResp = await fetch(api.prefix + "get_found/" + api.uid);
  let found = await foundResp.json();

  await api.cache.saveFound(found as string[]);
  return found as string[];
}