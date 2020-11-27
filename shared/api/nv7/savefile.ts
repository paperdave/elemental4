import {NV7ElementalAPI} from "./nv7";

export async function foundElement(api: NV7ElementalAPI, newElement: string): Promise<void> {
  var found: string[] = await api.store.get("found");
  if (!found.includes(newElement)) {
    await fetch(api.prefix + "new_found/" + api.uid + "/" + encodeURIComponent(newElement))
    found.push(newElement);
    await api.store.set("found", found);
  }
}
export async function getFound(api: NV7ElementalAPI): Promise<string[]> {
  let foundResp = await fetch(api.prefix + "get_found/" + api.uid);
  let found = await foundResp.json();
  await api.store.set("found", found as string[])
  return found as string[];
}