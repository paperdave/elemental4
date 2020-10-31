import { ElementalLoadingUi} from "../../elem";
import {NV7ElementalAPI} from "./nv7";
import firebase from "firebase/app";
import {Element, ElementMap} from "./types";

export async function login(api: NV7ElementalAPI, ui?: ElementalLoadingUi): Promise<boolean> {
  var uid = api.saveFile.get("user", "default")
  if (uid == "default") {
    var registering = false;
    while (true) {
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
          !registering && {
            id: -2,
            label: "Forgot?"
          },
          {
            id: -1,
            label: "Cancel",
          }
        ].filter(Boolean)
      });

      ui.status("Processing Login Info", 0);

      if (creds["button"] == 1) {
        ui.status("Processing Login Info", 1);
        var result = await new Promise((resolve, reject) => {
          ui.status("Authenticating", 0);
          var count = 0;
          if (registering) {
            firebase.auth().createUserWithEmailAndPassword(creds["email"], creds["password"]).catch(function(error) {
              ui.status("Authenticating", 1);
              resolve(error.message);
            });
          } else {
            firebase.auth().signInWithEmailAndPassword(creds["email"], creds["password"]).catch(function(error) {
              ui.status("Authenticating", 1);
              resolve(error.message);
            });
          }
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
        console.log(registering);
        registering = !registering;
      } else if (creds["button"] == -2) {
        ui.status("Sending Password Reset Email", 0.5)
        firebase.auth().sendPasswordResetEmail(creds["email"]).then(function(){
          ui.status("Sending Password Reset Email", 1)
        }).catch(function(error){
          ui.status("Showing Error", 0);
          api.ui.alert({
            "text": result as string,
            "title": "Error",
            "button": "Ok",
          });
        })
      }
    }
  } else {
    ui.status("Authenticated", 0);
    api.uid = uid;
    ui.status("Loading Game", 0);
    return true;
  }
}