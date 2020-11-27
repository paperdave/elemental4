import {Element} from "./types";
import {Elem} from "../../elem";
import { NV7ElementalAPI } from "./nv7";

export async function getElem(api: NV7ElementalAPI, id: string): Promise<Elem> {
  var elemData: Element = await api.store.get(id)
  if (!elemData) {
    const elemDataResp = await fetch(api.prefix + "get_elem/" + encodeURIComponent(id));
    elemData = (await elemDataResp.json() as Element)
    await api.store.set(id, elemData);
  }

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
