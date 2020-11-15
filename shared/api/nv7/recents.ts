import {RecentCombination} from "../../elem";
import { NV7ElementalAPI } from "./nv7";
import firebase from "firebase/app";
import "firebase/database";

export async function getRecents(limit: number): Promise<RecentCombination[]> {
  return new Promise<RecentCombination[]>((resolve, reject) => {
    firebase.database().ref("/recent/").once("value").then(async (snapshot) => {
      var data: RecentCombination[] = snapshot.val();
      if (!data) {
        resolve([]);
      } else {
        data.reverse();
        resolve(data);
      }
    })
  });
}

export async function waitForNew(api: NV7ElementalAPI): Promise<void> {
  api.ref = firebase.database().ref("/recents");
  return new Promise<void>((resolve, reject) => {
    var count = 0;
    api.ref.on("value", (snapshot) => {
      if (count == 0) {
        count++;
      } else {
        api.ref.off("value");
        resolve();
      }
    });
  })
}