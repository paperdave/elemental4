import { addElementToGame } from "../add-element";
import { getAPI } from "../api";
import { getOwnedElements } from "../savefile";
import { ClearElementGameUi } from "../element-game";
import { createLoadingUi } from "../loading";

function scrollElementIntoView(id: string) {
  const element = document.querySelector(`[data-element=${id}]`)
  element.scrollIntoView();
}

let searchBar: HTMLDivElement;

// To clear UI - do ClearElementGameUi from ../element-game
// To add elements back - Look into the code in onSaveFileLoad in ../api.ts
export async function startSearch() {
  searchBar = document.querySelector(".search");
  searchBar.style.display = "none"; // Hide

  const es = getAPI("search");
  var isSearching = false;
  if (es) {
    document.addEventListener("keyup", async (ev: KeyboardEvent) => {
      if (ev.key.length == 1 && !isSearching) {
        isSearching = true;
        showInput();
      }

      if (ev.key == "Escape" && isSearching) {
        isSearching = false;

        ClearElementGameUi();
        const ownedElements = await getOwnedElements(es);
        const elementsToAdd = await Promise.all(ownedElements.map(id => es.getElement(id)));
        for (var j = 0; j < elementsToAdd.length; j++) {
          addElementToGame(elementsToAdd[j], null, true);
        }

        hideInput();
      } else if (isSearching) {
        var ids = await es.searchForElement((searchBar.children[0] as HTMLInputElement).value);
        ClearElementGameUi();
        for (var i = 0; i < ids.length; i++) {
          addElementToGame(await es.getElement(ids[i]), null);
        }
      }
    })
  }
}

function showInput() {
  searchBar.style.animationName = "search-bar-slide-in";
  searchBar.style.removeProperty("display"); // Show
  (searchBar.children[0] as HTMLInputElement).value = "";
  (searchBar.children[0] as HTMLInputElement).focus();
}

async function hideInput() {
  searchBar.style.animationName = "search-bar-slide-out";

  var dupl: HTMLDivElement = searchBar.cloneNode(true) as HTMLDivElement;
  searchBar.before(dupl);
  searchBar.remove();
  searchBar = dupl;
  setTimeout(() => {
    searchBar.style.display = "none"; // Hide
  }, 400);
}
