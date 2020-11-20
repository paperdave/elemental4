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
  api.ref = new EventSource(api.config.firebaseConfig.databaseURL + "/recent.json");
  return new Promise<void>((resolve, _) => {
    api.ref.onmessage = function() {
      api.ref.close();
      resolve();
    }
  })
}