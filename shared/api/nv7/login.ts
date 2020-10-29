import { ElementalLoadingUi} from "../../elem";
import {NV7ElementalAPI} from "./nv7";
import firebase from "firebase";

export async function login(api: NV7ElementalAPI, ui?: ElementalLoadingUi): Promise<boolean> {
  var uid = api.saveFile.get("user", "default")
  if (uid == "default") {
    while (true) {
      var registering = true;
      ui.status("Requesting Login Info", 0);
      
      let creds = await api.ui.dialog({
        title: 'Nv7 Elemental Login',
        parts: [
          {
            id: "email",
            type: "email",
            placholder: "example@example.com",
            required: true,
          },
          {
            id: "password",
            type: "password",
            required: true,
          }
        ],
        buttons: [
          {
            id: 1,
            label: (!registering && "Log In") || (registering && "Register"),
          },
          {
            id: 0,
            label: (!registering && "Register") || (registering && "Log In"),
          },
          {
            id: -1,
            label: "Cancel",
          }
        ]
      });

      ui.status("Processing Login Info", 0);

      if (creds["button"] == 1) {
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
      } else if (creds["button"] == 0) {
        registering = !registering
      }
    }
  } else {
    ui.status("Authenticated", 0);
    api.uid = uid;
    ui.status("Loading Game", 0);
    return true;
  }
}