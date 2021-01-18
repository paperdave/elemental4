import { Nv7SingleAPI } from "./nv7single";
import { SuggestionResponse, SuggestionRequest } from "../../elem";
import { Element } from "./types";

export async function createElem(api: Nv7SingleAPI, sugg: SuggestionRequest<"dynamic-elemental4">, elem1: string, elem2: string): Promise<SuggestionResponse> {
  let commentData = await api.ui.prompt({
    title: "Comment",
    text: "Enter what you want the element comment to be below!"
  });
  var comment = "No comment."
  if (commentData) {
    comment = commentData;
  }
  var elem: Element = {
    name: sugg.text,
    color: sugg.color.base + "_" + sugg.color.saturation + "_" + sugg.color.lightness,
    comment: comment,
    parents: [elem1, elem2],
  }
  await api.cache.add(api.pack, elem.name, elem);
  await api.cache.add(api.pack, encodeURIComponent(elem1) + "+" + encodeURIComponent(elem2), elem.name);

  return {suggestType: "suggest", newElements: [elem.name]};
}
