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
        data.reverse();
        resolve(data);
      }
    })
  });
}