import firebase from "firebase/app";
import "firebase/firestore";
import {NV7ElementalAPI} from "./nv7";
import {Element} from "./types";
import {Elem} from "../../elem";

export async function getElem(id: string): Promise<Elem> {
  var elemData = await new Promise<Element>((resolve, _) => {
    firebase.firestore().collection("elements").doc(id).get().then((snapshot) => {
      resolve(snapshot.data() as Element);
    })
  })
  return {
    id: elemData.name,
    display: {
      text: elemData.name,
      color: elemData.color
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

export async function getCombination(elem1: string, elem2: string): Promise<string[]> {
   return new Promise<string[]>((resolve, _) => {
    firebase.firestore().collection("combos").doc(elem1).get().then((snapshot) => {
      var data = snapshot.data();
      if (data != null && elem2 in data) {
        resolve([data[elem2]]);
      } else {
        resolve(new Promise<string[]>((ret, __) => {
          firebase.firestore().collection("combos").doc(elem2).get().then((snap) => {
            if (data != null && elem1 in data) {
              ret([data[elem1]]);
            } else {
              ret([]);
            }
          });
        }))
      }
    })
  })
}