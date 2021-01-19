import {Element} from "./types";
import {Elem} from "../../elem";
import { Nv7SingleAPI } from "./nv7single";

export async function getElem(api: Nv7SingleAPI, id: string): Promise<Elem> {
  var elemData: Element = await api.cache.get(api.pack, id);
  while (!elemData) {
    await new Promise(resolve => setTimeout(resolve, 500));
    elemData = await api.cache.get(api.pack, id);
  }

  return {
    id: elemData.name,
    display: {
      text: elemData.name,
      color: elemData.color,
      categoryName: elemData.color.split("_")[0]
    },
    stats: {
      creators: [],
      comments: [
        {
          author: "",
          comment: elemData.comment
        }
      ],
      simplestRecipe: elemData.parents
    }
  };
}

export async function getCombination(api: Nv7SingleAPI, elem1: string, elem2: string): Promise<string[]> {
  let val = await api.cache.get(api.pack, encodeURIComponent(elem1) + "+" + encodeURIComponent(elem2));
  if (!val) {
    return [];
  }
  return [val];
}
