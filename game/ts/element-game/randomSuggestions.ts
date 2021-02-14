import { ElementalBaseAPI } from "../../../shared/elem";
import { showSuggestion } from "../add-element";
import { getAPI } from "../api";

export async function startRandomSuggestions() {
  const rs = getAPI("randomSuggestions");
  if (rs) {
    document.getElementById("randomLonely").addEventListener("click", async (ev) => {
      await openSuggestionMenu(await rs.randomLonelySuggestion(), rs);
    });
    document.getElementById("upAndComing").addEventListener("click", async (ev) => {
      await openSuggestionMenu(await rs.upAndComingSuggestion(), rs);
    });
  } else {
    document.getElementById("randomLonely").style.display = "none";
    document.getElementById("upAndComing").style.display = "none";
  }
}

async function openSuggestionMenu(suggestions: string[], api: ElementalBaseAPI) {
  if (!suggestions || suggestions.length == 0) {
    return;
  }
  showSuggestion(await api.getElement(suggestions[0]), await api.getElement(suggestions[1]));
}