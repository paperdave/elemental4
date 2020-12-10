import {NV7ElementalAPI} from "./nv7";

export async function foundElement(api: NV7ElementalAPI, newElement: string): Promise<void> {
  if (!((await api.saveFile.get("found")).includes(newElement))) {
    await fetch(api.prefix + "new_found/" + api.uid + "/" + encodeURIComponent(newElement))
    var existing = await api.saveFile.get("found");
    existing.push(newElement);
    await api.saveFile.set("found", existing);
  }
}
export async function getFound(api: NV7ElementalAPI): Promise<string[]> {
  let foundResp = await fetch(api.prefix + "get_found/" + api.uid);
  let found = await foundResp.json();

  await api.saveFile.set("found", found as string[]);
  return found as string[];
}
