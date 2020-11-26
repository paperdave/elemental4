import {Suggestion, SuggestionRequest, SuggestionResponse} from "../../elem";
import {SuggestionData} from "./types";
import { NV7ElementalAPI } from "./nv7";

async function getSuggestionCombo(api: NV7ElementalAPI, elem1: string, elem2: string): Promise<string[]> {
  let resp = await fetch(api.prefix + "suggestion_combos/" + encodeURIComponent(elem1) + "/" + encodeURIComponent(elem2))
  let suggestions = await resp.json() as string[];
  if (suggestions == null) {
    suggestions = [];
  }
  return suggestions
}

export async function getSuggests(api: NV7ElementalAPI, elem1: string, elem2: string): Promise<Suggestion<"dynamic-elemental4">[]>{
  var suggestions = await getSuggestionCombo(api, elem1, elem2);

  var output: Suggestion<"dynamic-elemental4">[] = [];
  for (var val in suggestions) {
    var data = await getSuggestion(api, suggestions[val])
    output.push({
      text: data.name,
      color: data.color
    });
  }

  return output;
}

async function getSuggestion(api: NV7ElementalAPI, id: string): Promise<SuggestionData> {
  let resp = await fetch(api.prefix + "get_suggestion/" + encodeURIComponent(id));
  let data = await resp.json() as SuggestionData;
  if (data == null) {
    return null;
  }
  return data;
}

export async function downSuggestion(request: SuggestionRequest<"dynamic-elemental4">, api: NV7ElementalAPI): Promise<void> {
  var id = request.text;
  let resp = await fetch(api.prefix  + "down_suggestion/" + id + "/" + api.uid);
  var text = await resp.text();
  if (text != "") {
    await api.ui.alert({
      "text": text,
      "title": "Error",
      "button": "Ok",
    });
  }
}

async function upvoteSuggestion(id: string, api: NV7ElementalAPI, parents: string[]): Promise<SuggestionResponse> {
  let resp = await fetch(api.prefix  + "up_suggestion/" + id + "/" + api.uid);
  var text = await resp.text();
  if (text == "create") {
    let commentData = await api.ui.prompt({
      title: "Confirm Creator Mark",
      text: "Enter below what you want to use for your creator mark. You are responsible for the creation of this element!"
    });
    var comment = "No comment."
    if (commentData) {
      comment = commentData;
    }
    resp = await fetch(api.prefix + "create_suggestion/" + encodeURIComponent(parents[0]) + "/" + encodeURIComponent(parents[1]) + "/" + encodeURIComponent(id) + "/" + encodeURIComponent(comment) + "/" + encodeURIComponent(api.saveFile.get("email", "anonymous")));
    text = await resp.text();
    if (text != "") {
      await api.ui.alert({
        "text": text,
        "title": "Error",
        "button": "Ok",
      });
      return {
        suggestType: "failed"
      }
    }

    return {
      suggestType: "vote",
      newElements: [id]
    }
  }
  if (text != "") {
    await api.ui.alert({
      "text": text,
      "title": "Error",
      "button": "Ok",
    });
    return {
      suggestType: "failed"
    }
  }
  return {
    suggestType: "vote"
  }
}

export async function newSuggestion(elem1: string, elem2: string, request: SuggestionRequest<"dynamic-elemental4">, api: NV7ElementalAPI): Promise<SuggestionResponse> {
  var existing = await getSuggestionCombo(api, elem1, elem2);
  
  for (var i = 0; i < existing.length; i++) {
    if (existing[i] == request.text) {
      return upvoteSuggestion(existing[i], api, [elem1, elem2]);
    }
  }

  var newSuggest: SuggestionData = {
    name: request.text,
    creator: api.saveFile.get("email", "anonymous"),
    color: request.color,
    votes: 0,
    voted: [api.uid]
  }

  let resp = await fetch(api.prefix + "new_suggestion/" + encodeURIComponent(elem1) + "/" + encodeURIComponent(elem2) + "/" + encodeURIComponent(JSON.stringify(newSuggest)))
  const text = await resp.text();
  if (text != "") {
    await api.ui.alert({
      "text": text,
      "title": "Error",
      "button": "Ok",
    });
  }
  return {
    suggestType: "suggest"
  }
}
