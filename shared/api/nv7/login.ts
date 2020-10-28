import { ElementalLoadingUi} from "../../elem";
import {NV7ElementalAPI} from "./nv7";
import firebase from "firebase";

export async function login(api: NV7ElementalAPI, ui?: ElementalLoadingUi): Promise<boolean> {
  var uid = api.saveFile.get("user", "default")
  if (uid == "default") {
    while (true) {
      ui.status("Requesting Login Info", 0);
      let creds = await api.ui.prompt({
        title: 'Nv7 Elemental Login',
        text: 'Put in your password and email somehow',
        defaultText: '',
        confirmButton: 'Log In',
      });

      ui.status("Processing Login Info", 0);

      if (creds) {
        ui.status("Processing Login Info", 1);
        var result = await new Promise((resolve, reject) => {
          ui.status("Authenticating", 0);
          var count = 0;
          firebase.auth().createUserWithEmailAndPassword(creds, "Reee12345_12365").catch(function(error) {
            ui.status("Authenticating", 1);
            resolve(error.message);
          });
          firebase.auth().onAuthStateChanged((user) => {
            if (user) {
              api.uid = user.uid;
              api.saveFile.set("user", api.uid);
              count++;
              ui.status("Authenticating", 0.5);
              if (count == 2) {
                ui.status("Authenticating", 1);
                resolve(true);
              }
            }
          });
        });

        if (result == true) {
          ui.status("Loading Game", 0);
          return true;
        } else {
          ui.status("Showing Error", 0);
          await api.ui.alert({
            "text": result as string,
            "title": "Error",
            "button": "Ok",
          });
        }
      }
    }
  } else {
    ui.status("Authenticated", 0);
    api.uid = uid;
    ui.status("Loading Game", 0);
    return true;
  }
}