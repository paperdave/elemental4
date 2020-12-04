import { getClassFromDisplay, getCSSFromDisplay } from "./element-color";
import { delay, escapeHTML, formatDate, sortCombo } from "../../shared/shared";
import { capitalize, plural } from "@reverse/string";
import { getConfigBoolean, setConfigBoolean, setElementAsOwned } from "./savefile";
import { Elem } from "../../shared/elem";
import { getAPI } from "./api";
import { randomOf } from "@reverse/random";
import { compactMiniNumber } from "@reverse/compact";
import { incrementStatistic } from "./statistics";
import { playSound } from "./audio";
import { getElementTree, initTreeCanvas } from "./tree";
import { formatCategory, updateSuggestion, ElementDom} from "./utils";
import { elementPopAnimation, elementErrorAnimation } from "./element-game/element-animations";
import Color from "color";
import { tutorial1visible, holdingElement, elementContainer, setTutorial1Visible, setTutorial2Visible, suggestLeftElem, suggestRightElem, dropHoldingElement, suggestContainer, suggestOther1Elem, suggestOther2Elem, suggestOther3Elem, suggestOther1Downvote, suggestOther2Downvote, suggestOther3Downvote, suggestOtherHeader, suggestHint, suggestResultElem, holdingRect, infoContainer, setSuggestResult, setInfoOpen, setHoldingRect, setHoldingElement, setHoldingElementDom } from "./element-game";

// Adds an element and has most element logic
export function addElementToGame(element: Elem, sourceLocation?: HTMLElement, duringLoad?: boolean) {
  if(!element) return;
  const alreadyExistingDom = document.querySelector(`[data-element="${element.id}"]`) as HTMLElement;
  
  if (alreadyExistingDom) {
    incrementStatistic('rediscoveries');

    if(!sourceLocation) {
      if (!alreadyExistingDom.classList.contains('animate-bounce')) {
        alreadyExistingDom.classList.add('animate-bounce');
        setTimeout(() => {
          alreadyExistingDom.classList.remove('animate-bounce');
        }, 600);
      }
    } else {
      elementPopAnimation(element, sourceLocation, alreadyExistingDom, false);
    }
    return;
  } else {
    if (!duringLoad) {
      setElementAsOwned(getAPI(), element.id);
    }
  }

  const dom = ElementDom(element);

  dom.addEventListener('click', async(ev) => {
    if (tutorial1visible) {
      document.querySelector('#tutorial1').classList.remove('tutorial-visible');
      setTutorial1Visible(false);
      setConfigBoolean('tutorial1', true);
      setTimeout(() => {
        (document.querySelector('#tutorial1') as HTMLElement).style.display = 'none';
      }, 250);
    }
  
    if (holdingElement) {
      const id1 = element.id
      const id2 = holdingElement.id
      const element2 = holdingElement;

      const [results] = await Promise.all([
        // Combo Logic, returns elements to add
        (async() => {
          const combo = await getAPI().getCombo(sortCombo(id1, id2));
          if(combo.length === 0) {
            return null;
          } else {
            return Promise.all(combo.map(x => getAPI().getElement(x)))
          }
        })(),
        // Play Animation.
        dropHoldingElement(dom),
      ]);

      dom.classList.remove('restock');
      void dom.offsetWidth;
      dom.classList.add('restock');

      if (results) {
        incrementStatistic('combinationsSuccess');
        results.forEach(result => {
          addElementToGame(result, dom);
        });
      } else {
        incrementStatistic('combinationsFailure');
        elementErrorAnimation(dom);
        
        const api = getAPI('suggestion');
        if (api) {
          const [base, saturation, lightness] = randomOf([element, element2]).display.color.split('_');
          
          setSuggestResult({
            color: {
              base: base as any,
              lightness: parseFloat(lightness),
              saturation: parseFloat(saturation),
            },
            text:'New Element'
          }, element, element2)

          suggestLeftElem.innerHTML = escapeHTML(element.display.text);
          suggestLeftElem.className = `elem ${getClassFromDisplay(element.display)}`;
          suggestRightElem.innerHTML = escapeHTML(element2.display.text);
          suggestRightElem.className = `elem ${getClassFromDisplay(element2.display)}`;

          document.querySelector('[data-suggest-prompt="left"]').innerHTML = escapeHTML(element.display.text);
          document.querySelector('[data-suggest-prompt="right"]').innerHTML = escapeHTML(element2.display.text);

          suggestResultElem.style.display = '';

          updateSuggestion();

          suggestContainer.classList.add('animate-prompt');
          suggestContainer.style.width = '';
          suggestContainer.style.width = (suggestContainer.offsetWidth+5) + 'px'

          suggestOtherHeader.classList.add('no');
          suggestOther1Elem.classList.add('no');
          suggestOther1Downvote.classList.add('no');
          suggestOther2Elem.classList.add('no');
          suggestOther2Downvote.classList.add('no');
          suggestOther3Elem.classList.add('no');
          suggestOther3Downvote.classList.add('no');

          suggestHint.classList.add('animate-in');
          if (!getConfigBoolean('tutorial2', false)) {
            setTutorial2Visible(true);
            document.querySelector('#tutorial2').classList.add('tutorial-visible');
            (document.querySelector('#tutorial2') as HTMLElement).style.display = 'block';
          }
          if (getConfigBoolean('always-suggest', false)) {
            suggestContainer.style.width = '486px'
            document.querySelector('.suggest-label').dispatchEvent(new MouseEvent('click'));
          }
        }
      }
    } else {
      playSound('element.pickup');
      incrementStatistic('elementsPickedUp');
      setHoldingRect(dom.getBoundingClientRect());

      dom.classList.remove('restock');
      void dom.offsetWidth;
      dom.classList.add('restock');

      setHoldingElement(element);

      const holdingDom = ElementDom(element);
      holdingDom.classList.add('held');
      const wrapper = document.createElement('div');
      wrapper.setAttribute(
        'style',
        '--offset-x:' + ((holdingRect.left - 8) - (ev.pageX)) + 'px;'
        + '--offset-y:' + ((holdingRect.top - 8) - (ev.pageY + 4)) + 'px;'
        + 'left:' + ev.pageX + 'px;'
        + 'top:' + (ev.pageY + 4) + 'px'
      )
      wrapper.classList.add('elem-held-wrapper');
      wrapper.appendChild(holdingDom);
      document.body.appendChild(wrapper);
      setHoldingElementDom(wrapper);
    }
  });

  dom.addEventListener('contextmenu', async(ev) => {
    incrementStatistic('infoOpened');
    
    infoContainer.classList.remove('animate-in');

    dropHoldingElement();
    ev.preventDefault();

    if(!element.stats) element.stats = {};

    dom.style.height = '150px';
    dom.style.top = '-10px';
    dom.scrollIntoView({ block: 'nearest' });
    dom.style.height = '';
    dom.style.top = '';
    await delay(0);

    infoContainer.style.display = 'flex';
    const box = dom.getBoundingClientRect();
    const x = Math.max(8, Math.min(window.innerWidth - 462 - 8, box.left - 17));
    const y = Math.max(38, Math.min(window.innerHeight - 402 - 8, box.top - 17));
    infoContainer.style.left = x + 'px';
    infoContainer.style.top = y + 'px';
    infoContainer.classList.add('animate-in');
    setInfoOpen(true);

    infoContainer.querySelectorAll('.info-tab,.info-section')
      .forEach(x => x.classList.remove('selected'));

    infoContainer.querySelector('.info-section-info').classList.add('selected');
    infoContainer.querySelector('[data-info-tab="info"]').classList.add('selected');

    infoContainer.querySelector('.elem').innerHTML = escapeHTML(element.display.text);
    infoContainer.querySelector('.elem').className = `elem ${getClassFromDisplay(element.display)}`;
    infoContainer.querySelector('#element-info-title').innerHTML = isNaN(Number(element.id)) ? 'Element Info' : `Element #${Number(element.id)}`;

    (infoContainer.querySelector('#element-created-date-root') as HTMLElement).style.display = element.createdOn ? '' : 'none';
    if (element.createdOn) {
      infoContainer.querySelector('#element-created-date').innerHTML = `${formatDate(new Date(element.createdOn))}`;
    }
    (infoContainer.querySelector('#info-tier') as HTMLElement).style.display = element.stats.treeComplexity !== undefined ? '' : 'none';
    if (element.stats.treeComplexity !== undefined) {
      infoContainer.querySelector('#info-tier').innerHTML = element.stats.treeComplexity ? `Tier ${element.stats.treeComplexity}` : 'Starter';
      infoContainer.querySelector('#info-tier').setAttribute('data-tier-level', Math.floor(element.stats.treeComplexity / 5).toString());
    }
    
    if (typeof element.stats.recipeCount === 'number') {
      infoContainer.querySelector('#element-recipe-count').innerHTML = element.stats.recipeCount + ' ' + plural(element.stats.recipeCount, 'Recipe');
    }
    if (typeof element.stats.usageCount === 'number') {
      infoContainer.querySelector('#element-usage-count').innerHTML = element.stats.usageCount + ' ' + plural(element.stats.usageCount, 'Uses');
    }

    infoContainer.querySelector('#element-comments').innerHTML = (element.stats?.comments || []).map(x => {
      if (x.author) {
        // elem4 doesnt properly decode authors
        return `<p>"${x.comment}" - Error</p>`;
      }
      return `<p>${x.comment}</p>`;
    }).join('');
    infoContainer.querySelector('#element-data-json').innerHTML = JSON.stringify(element, null, 2);
    infoContainer.querySelector('#element-css-class').innerHTML = `.${getClassFromDisplay(element.display)}`;
    infoContainer.querySelector('#element-css-color').innerHTML = Color(getComputedStyle(dom).backgroundColor).hex();

    const fundamentalsDiv = document.getElementById('element-fundamentals');
    fundamentalsDiv.innerHTML = '';
    const fundamentalsWithImages = ['fire', 'water', 'air', 'earth'];
    if(element.stats.fundamentals) {
      Object.keys(element.stats.fundamentals).forEach((key) => {
        const root = document.createElement('div');
        root.classList.add('data-row')
  
        if (fundamentalsWithImages.includes(key)) {
          const img = document.createElement('img');
          img.src = '/' + key + '.svg';
          root.appendChild(img);
        } else {
          const text = document.createElement('strong');
          text.innerHTML = escapeHTML(capitalize(key));
          root.appendChild(text);
        }
  
        const text = document.createElement('span');
        text.innerHTML = compactMiniNumber(element.stats.fundamentals[key]);
        root.appendChild(text);
  
        fundamentalsDiv.appendChild(root);
      });
    }

    (infoContainer.querySelector('.info-equation-container') as HTMLElement).style.display = '';

    getElementTree(element).then((tree) => {
      if (tree.parent1) {
        let left = tree.parent1;
        let right = tree.parent2 || tree.parent1;
        (infoContainer.querySelector('.info-equation-container') as HTMLElement).style.display = '';
        infoContainer.querySelector('#info-left-element').innerHTML = escapeHTML(left.elem.display.text);
        infoContainer.querySelector('#info-left-element').setAttribute('style', getCSSFromDisplay(left.elem.display));
        infoContainer.querySelector('#info-right-element').innerHTML = escapeHTML(right.elem.display.text);
        infoContainer.querySelector('#info-right-element').setAttribute('style', getCSSFromDisplay(right.elem.display));
        initTreeCanvas(tree);
      } else {
        (infoContainer.querySelector('.info-equation-container') as HTMLElement).style.display = 'none';
      }
    });
  });

  dom.setAttribute('data-element', element.id);

  const categoryName = element.display.categoryName || element.display.color || 'none';
  let categoryDiv = elementContainer.querySelector(`[data-category="${categoryName}"]`);
  if (!categoryDiv) {
    const header = document.createElement('h3');
    header.classList.add('category-header')
    header.appendChild(document.createTextNode(formatCategory(categoryName)));
    elementContainer.appendChild(header);
    categoryDiv = document.createElement('div');
    categoryDiv.setAttribute('data-category', categoryName);
    elementContainer.appendChild(categoryDiv);
  }

  if(sourceLocation) {
    dom.style.opacity = '0';
  } else {
    dom.classList.add('animate-in');
    setTimeout(() => {
      dom.classList.remove('animate-in');
    }, 1000);
  }

  categoryDiv.appendChild(dom);

  if(sourceLocation) {
    elementPopAnimation(element, sourceLocation, dom, true).then(() => {
      dom.style.opacity = '1';
    })
  }
}
