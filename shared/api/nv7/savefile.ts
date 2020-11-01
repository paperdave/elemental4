import {NV7ElementalAPI} from "./nv7";
import firebase from "firebase/app";
import 'firebase/database';

export async function foundElement(api: NV7ElementalAPI, newElement: string): Promise<void> {
    var found = await new Promise((ret, _) => {
      firebase.database().ref("users/" + api.uid + "/found").once('value').then(function(snapshot) {
        ret(snapshot.val());
      });
    });
    var foundElems = found as string[];
    foundElems.push(newElement);
    return firebase.database().ref("users/" + api.uid + "/found").set({
      found: foundElems,
    }, async function(error) {
      if (error) {
        api.ui.status("Showing Error", 0);
        await api.ui.alert({
        "text": error.message,
        "title": "Error",
        "button": "Ok",
        });
      }
    });
}