import firebase from "firebase/app";
import "firebase/firestore";
import {NV7ElementalAPI} from "./nv7";
import {Element} from "./types";
import {Elem} from "../../elem";

export async function getElem(api: NV7ElementalAPI, id: string): Promise<Elem> {
  var elemData = await new Promise<Element>((resolve, reject) => {
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