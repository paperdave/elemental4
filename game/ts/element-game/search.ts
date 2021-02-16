import { delay } from "../../../shared/shared";

function filterVisibleElements(str: string = '') {
  document.querySelectorAll('#element-game-root .elem')
    .forEach((elem: HTMLElement) => {
      elem.classList.remove('restock');
      elem.style.display = elem.innerHTML.toLowerCase().includes(str) ? '' : 'none';
    });
}

export async function startSearch() {
  const searchContainer = document.querySelector("#search-container") as HTMLDivElement;
  const searchInput = document.querySelector("#search") as HTMLInputElement;

  document.addEventListener("keyup", (ev: KeyboardEvent) => {
    if ((ev.key.length == 1 || ev.key === 'Backspace') && !ev.ctrlKey && !ev.altKey && document.activeElement === document.body && !document.querySelector('.dialog-open')) {
      ev.preventDefault();
      if (ev.key === 'Backspace') {
        searchInput.value = searchInput.value.slice(0, -1);
      } else {
        searchInput.value += ev.key;
      }
      searchContainer.classList.add('animate-in');
      searchInput.disabled = false;
      searchInput.focus();
      // delay to prevent a small lag spike
      delay(10).then(() => filterVisibleElements(searchInput.value.toLowerCase()));
    }
  });
  searchInput.addEventListener("input", (ev: KeyboardEvent) => {
    filterVisibleElements(searchInput.value.toLowerCase());
  });
  document.addEventListener("keydown", (ev: KeyboardEvent) => {
    if (ev.key === "Escape" && !searchInput.disabled) {
      searchInput.value = '';
      searchInput.disabled = true;
      searchContainer.classList.remove('animate-in');
      filterVisibleElements();
    }
  });
}
