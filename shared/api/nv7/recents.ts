import {RecentCombination} from "../../elem";
import firebase from "firebase/app";
import "firebase/database";

export async function getRecents(limit: number): Promise<RecentCombination[]> {
  return new Promise<RecentCombination[]>((resolve, reject) => {
    firebase.database().ref("/recent/").once("value").then(async (snapshot) => {
      var data: RecentCombination[] = snapshot.val();
      if (!data) {
        resolve([]);
      } else {
        if (data.length > limit) {
          data = data.slice(data.length-limit, data.length);
          await firebase.database().ref("/recent/").update(data);
        }
        data.reverse();
        resolve(data);
      }
    })
  });
}