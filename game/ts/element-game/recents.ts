import { getAPI } from "../api";
import { ElementDom } from "../utils";
import { playSound } from "../audio";
import { ElementalBaseAPI, RecentCombination } from "../../../shared/elem";

export async function getRecentCombinationDOM(rc: ElementalBaseAPI, x: RecentCombination) {
  const root = document.createElement('div');
  root.classList.add('news-combo');
  const eq1 = document.createElement('div');
  eq1.classList.add('equation-symbol');
  const eq2 = document.createElement('div');
  eq2.classList.add('equation-symbol');

  eq1.innerHTML = '+';
  eq2.innerHTML = '=';

  const [elem1, elem2, elem3] = await Promise.all([
    rc.getElement(x.recipe[0]).then(x => ElementDom(x)),
    rc.getElement(x.recipe[1]).then(x => ElementDom(x)),
    rc.getElement(x.result).then(x => ElementDom(x)),
  ]);

  root.appendChild(elem1);
  root.appendChild(eq1);
  root.appendChild(elem2);
  root.appendChild(eq2);
  root.appendChild(elem3);

  return root;
}
export async function InitElementNews() {
  const rc = getAPI('recentCombinations');
  if(rc) {
    const combinations = await rc.getRecentCombinations(30);
    const newsItems = await Promise.all(combinations.map((x) => getRecentCombinationDOM(rc, x)));

    const container = document.querySelector('.news-container');
    container.innerHTML = '';
    newsItems.forEach(x => container.appendChild(x));

    async function onNewRecent() {
      rc.waitForNewRecent().then(onNewRecent);
      playSound('news.new-element');
      const combo = await rc.getRecentCombinations(1);
      const elem = await getRecentCombinationDOM(rc, combo[0]);
      elem.classList.add('animate-in');
      container.prepend(elem);
      container.lastElementChild.remove();
    }
    rc.waitForNewRecent().then(onNewRecent);
  }
}
