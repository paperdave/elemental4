import {Suggestion, SuggestionRequest, SuggestionResponse} from "../../elem";
import {SuggestionData} from "./types";
import firebase from "firebase/app";
import 'firebase/database';
import 'firebase/firestore';
import { NV7ElementalAPI } from "./nv7";
import { Element } from "./types";

async function getSuggestionCombo(elem1: string, elem2: string): Promise<string[]> {
  var suggestions = await new Promise<string[]>((resolve, _) => {
    firebase.database().ref("/suggestionMap/" + elem1 + "/" + elem2).once("value").then((snapshot) => {
      resolve(snapshot.val());
    });
  });
  if (suggestions == null) {
    suggestions = [];
  }
  return suggestions.concat(await new Promise<string[]>((resolve, _) => {
    firebase.database().ref("/suggestionMap/" + elem2 + "/" + elem1).once("value").then((snapshot) => {
      if (snapshot.val()) {
        resolve(snapshot.val());
      } else {
        resolve([]);
      }
    });
  }));
}

export async function getSuggests(elem1: string, elem2: string): Promise<Suggestion<"dynamic-elemental4">[]>{
  var suggestions = await getSuggestionCombo(elem1, elem2);

  var output: Suggestion<"dynamic-elemental4">[] = [];
  for (var val in suggestions) {
    output.push(await getSuggestion(suggestions[val]));
  }

  return output;
}

async function getSuggestion(id: string): Promise<Suggestion<"dynamic-elemental4">> {
  return await new Promise<Suggestion<"dynamic-elemental4">>((resolve, _) => {
    firebase.database().ref("/suggestions/" + id).once("value").then((snapshot) => {
      var val = snapshot.val() as SuggestionData;
      if (val) {
        resolve({
          text: val.name,
          color: val.color
        });
      } else {
        resolve(null);
      }
    }).catch((err) => {
      console.log(err);
    });
  });
}

export async function downSuggestion(elem1: string, elem2: string, request: SuggestionRequest<"dynamic-elemental4">, api: NV7ElementalAPI): Promise<void> {
  var id = request.text;

  var alreadyVoted = await new Promise<string[]>((res, rej) => {
    firebase.database().ref("users/" + api.uid + "/voted").once("value").then((snapshot) => {
      let data = snapshot.val();
      if (!data) {
        data = [];
      }
      res(data);
    });
  });

  if (alreadyVoted.includes(id)) {
    await api.ui.alert({
      title: "Already Downvoted",
      text: "You already voted!"
    })
    return;
  }

  var existing: SuggestionData = await new Promise<SuggestionData>((resolve, _) => {
    firebase.database().ref("/suggestions/" + id).once("value").then((snapshot) => {
      resolve(snapshot.val() as SuggestionData);
    });
  });

  existing.votes--;

  if (existing.votes < -1) {
    await firebase.database().ref("/suggestions/" + id).remove();
    return new Promise<void>(async (resolve, reject) => {
      firebase.database().ref("/suggestionMap/" + elem1 + "/" + elem2).once("value").then(async (snapshot) => {
        var data = snapshot.val();
        if (!data) {
         resolve();
        } else {
          data.splice(data.indexOf(id), 1);
          await firebase.database().ref("/suggestionMap/" + elem1 + "/" + elem2).set(data);

          resolve();
        }
      });
    })
  }

  alreadyVoted.push(id);
  await firebase.database().ref("users/" + api.uid).update({
    voted: alreadyVoted,
  });

  return firebase.database().ref("/suggestions/" + id).update(existing);
}

async function upvoteSuggestion(id: string, api: NV7ElementalAPI, request: SuggestionRequest<"dynamic-elemental4">, parents: string[]): Promise<SuggestionResponse> {
  var alreadyVoted = await new Promise<string[]>((res, rej) => {
    firebase.database().ref("users/" + api.uid + "/voted").once("value").then((snapshot) => {
      let data = snapshot.val();
      if (!data) {
        data = [];
      }
      res(data);
    });
  });

  if (alreadyVoted.includes(id)) {
    await api.ui.alert({
      title: "Already Voted",
      text: "You already voted!"
    })
    return {
      suggestType: "already-added"
    }
  }

  var existing: SuggestionData = await new Promise<SuggestionData>((resolve, _) => {
    firebase.database().ref("/suggestions/" + id).once("value").then((snapshot) => {
      resolve(snapshot.val() as SuggestionData); 
    });
  });

  existing.votes++;

  if (existing.votes > api.votesRequired) {
    await firebase.database().ref("/suggestions/" + id).remove();

    let commentData = await api.ui.prompt({
      title: "Confirm Creator Mark",
      text: "Enter below what you want to use for your creator mark. You are responsible for the creation of this element!"
    });
    var comment = "No comment."
    if (commentData) {
      comment = commentData;
    }

    // Created element
    var element: Element = {
      name: request.text,
      color: existing.color.base + "_" + existing.color.saturation + "_" + existing.color.lightness,
      creator: existing.creator,
      pioneer: api.saveFile.get("email", "anonymous"),
      parents: parents,
      comment: comment,
      createdOn: new Date().getTime()
    }

    await firebase.firestore().collection("elements").doc(element.name).set(element);

    return new Promise<SuggestionResponse>(async (resolve, reject) => {
      firebase.firestore().collection("combos").doc(parents[0]).get().then(async (snapshot) => {
        var data = snapshot.data();
        if (!data) {
          data = {};
        }
        data[parents[1]] = element.name;
        await firebase.firestore().collection("combos").doc(parents[0]).set(data);
        resolve({
          suggestType: "vote",
          newElements: [element.name]
        })
      })
    })
  }

  return new Promise<SuggestionResponse>(async (resolve, reject) => {
    await firebase.database().ref("/suggestions/" + id).update(existing).catch(async (error) => {
      api.ui.status("Showing Error", 0);
      await api.ui.alert({
        "text": error.message,
        "title": "Error",
        "button": "Ok",
      });
      resolve({
        suggestType: 'failed'
      })
    }).then(async (val) => {
      let error = await new Promise<Error>((ret, _) => {
        alreadyVoted.push(id);

        firebase.database().ref("users/" + api.uid).update({
          voted: alreadyVoted,
        }, async function(err) {
          ret(err);
        });
      })
      if (!error) {
        resolve({
          suggestType: 'vote'
        })
      } else {
        api.ui.status("Showing Error", 0);
        await api.ui.alert({
          "text": error.message,
          "title": "Error",
          "button": "Ok",
        });
        resolve({
          suggestType: 'failed'
        })
      }
    });
  })
}

export async function newSuggestion(elem1: string, elem2: string, request: SuggestionRequest<"dynamic-elemental4">, api: NV7ElementalAPI): Promise<SuggestionResponse> {
  var existing = await getSuggestionCombo(elem1, elem2);
  
  for (var i = 0; i < existing.length; i++) {
    if (existing[i] == request.text) {
      return upvoteSuggestion(existing[i], api, request, [elem1, elem2]);
    }
  }

  var newSuggest: SuggestionData = {
    name: request.text,
    creator: api.saveFile.get("email", "anonymous"),
    color: request.color,
    votes: 0,
  }

  await firebase.database().ref("/suggestions/" + newSuggest.name).set(newSuggest);

  return new Promise<SuggestionResponse>(async (resolve, reject) => {
    firebase.database().ref("/suggestionMap/" + elem1 + "/" + elem2).once("value").then(async (snapshot) => {
      var data = snapshot.val();
      if (!data) {
        data = [];
      }
      data.push(newSuggest.name);
      await firebase.database().ref("/suggestionMap/" + elem1 + "/" + elem2).set(data);

      var alreadyVoted = await new Promise<string[]>((res, rej) => {
        firebase.database().ref("users/" + api.uid + "/voted").once("value").then((snap) => {
          let dat = snap.val();
          if (!dat) {
            dat = [];
          }
          res(dat);
        });
      });
      alreadyVoted.push(newSuggest.name);
      await firebase.database().ref("users/" + api.uid).update({
        voted: alreadyVoted,
      });

      resolve({
        suggestType: "suggest"
      })
    });
  })
}