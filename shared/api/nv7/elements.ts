import {Element} from "./types";
import {Elem} from "../../elem";
import { NV7ElementalAPI } from "./nv7";

export async function getElem(api: NV7ElementalAPI, id: string): Promise<Elem> {
  const url = api.prefix + "get_elem/" + encodeURIComponent(id);
  var cache = await window.caches.open("Nv7Elemental")
  if (!('json' in cache.match(url))) {
    await cache.add(url);
  }
  const elemData: Element = await (await cache.match(url)).json() as Element;

  return {
    id: elemData.name,
    display: {
      text: elemData.name,
      color: elemData.color,
      categoryName: elemData.color.split("_")[0]
    },
    createdOn: elemData.createdOn,
    stats: {
      creators: [elemData.creator, elemData.pioneer],
      comments: [
        {
          author: elemData.pioneer,
          comment: elemData.comment
        }
      ],
      simplestRecipe: elemData.parents
    }
  };
}

export async function getCombination(api: NV7ElementalAPI, elem1: string, elem2: string): Promise<string[]> {
  const comboResp = await fetch(api.prefix + "get_combo/" + encodeURIComponent(elem1) + "/" + encodeURIComponent(elem2))
  let comboData = await comboResp.json()
  if (!comboData.exists) {
    return [];
  }
  return [comboData.combo];
}
