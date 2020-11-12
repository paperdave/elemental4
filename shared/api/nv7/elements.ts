import firebase from "firebase/app";
import "firebase/firestore";
import {Element} from "./types";
import {Elem} from "../../elem";
import { NV7ElementalAPI } from "./nv7";

export async function getElem(api: NV7ElementalAPI, id: string): Promise<Elem> {
  var elemData: Element = await api.store.get(id)
  if (!elemData) {
    elemData = await new Promise<Element>((resolve, _) => {
      firebase.firestore().collection("elements").doc(id).get().then((snapshot) => {
        resolve(snapshot.data() as Element);
      })
    })
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
  var combo = await api.store.get(encodeURIComponent(elem1) + "+" + encodeURIComponent(elem2))
  if (!combo) {
    combo = await new Promise<string[]>((resolve, _) => {
      firebase.firestore().collection("combos").doc(elem1).get().then((snapshot) => {
        var data = snapshot.data();
        if (data != null && elem2 in data) {
          resolve([data[elem2]]);
        } else {
          resolve([]);
        }
      })
    })
    if (combo.length > 0) {
      api.store.set(encodeURIComponent(elem1) + "+" + encodeURIComponent(elem2), combo)
    }
  }
  return combo
}