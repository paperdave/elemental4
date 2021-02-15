let searchBar: HTMLDivElement;

function filterVisibleElements(str: string = '') {
  console.log(str);
  document.querySelectorAll('#element-game-root .elem')
    .forEach((elem: HTMLElement) => {
      elem.style.display = elem.innerHTML.toLowerCase().includes(str) ? '' : 'none';
    });
}

export async function startSearch() {
  searchBar = document.querySelector(".search");
  searchBar.style.display = "none"; // Hide

  var isSearching = false;
  document.addEventListener("keyup", async (ev: KeyboardEvent) => {
    if (ev.key.length == 1 && !isSearching && document.activeElement == document.body) {
      isSearching = true;
      (searchBar.children[0] as HTMLInputElement).value = ev.key;
      showInput();
    }

    if (ev.key == "Escape" && isSearching) {
      isSearching = false;
      filterVisibleElements()
      hideInput();
    } else if (isSearching) {
      filterVisibleElements(searchBar.children[0].value.toLowerCase());
    }
  })
}

function showInput() {
  searchBar.style.animationName = "search-bar-slide-in";
  searchBar.style.removeProperty("display"); // Show
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
