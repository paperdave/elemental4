import { getClassFromDisplay, getCSSFromDisplay } from "./element-color";
import { query } from 'jsonpath';
import { arrayGet3Random, delay, delayFrame, escapeHTML, sortCombo } from "../../shared/shared";
import { capitalize } from "@reverse/string";
import { getConfigBoolean, setConfigBoolean, setElementAsOwned } from "./savefile";
import { Elem, Suggestion } from "../../shared/elem";
import { getAPI } from "./api";
import { E4Suggestion } from "../../shared/elemental4-types";
import { randomOf } from "@reverse/random";
import DomToImage from 'dom-to-image';
import { incrementStatistic } from "./statistics";
import { OFFLINE } from ".";
import { playSound } from "./audio";

function formatCategory(x: string) {
  return x.split('-').map(capitalize).join(' ')
}

let elementContainer: HTMLElement;
let infoContainer: HTMLElement;
let infoContainerContainer: HTMLElement;
let suggestContainer: HTMLElement;
let suggestResultElem: HTMLTextAreaElement;
let suggestLeftElem: HTMLElement;
let suggestRightElem: HTMLElement;
let suggestHint: HTMLElement;

let suggestOtherHeader: HTMLElement;
let suggestOther1Elem: HTMLElement;
let suggestOther1Downvote: HTMLElement;
let suggestOther2Elem: HTMLElement;
let suggestOther2Downvote: HTMLElement;
let suggestOther3Elem: HTMLElement;
let suggestOther3Downvote: HTMLElement;
let suggestOther1: Suggestion<'dynamic-elemental4'>;
let suggestOther2: Suggestion<'dynamic-elemental4'>;
let suggestOther3: Suggestion<'dynamic-elemental4'>;

let tutorial1visible = false;
let tutorial2visible = false;

let infoOpen = false;
let holdingElement: Elem = null;
let holdingElementDom: HTMLElement = null;
let holdingRect: DOMRect;

let suggestLeft: Elem;
let suggestRight: Elem;
let suggestResult: E4Suggestion;

function getElementMargin() {
  const x = document.querySelector('.elem') as HTMLElement;
  if(x) {
    const y = parseFloat(getComputedStyle(x).marginLeft);
    return y;
  }
  return 8 
}

async function dropHoldingElement(combineWith?: HTMLElement) {
  holdingElement = null;
  if (holdingElementDom) {
    const x = holdingElementDom;
    holdingElementDom = null;

    incrementStatistic('elementsDropped');

    if(getConfigBoolean('animations', true)) {
      if(!combineWith) {
        playSound('element.drop');
        x.classList.add('drop');
        await delay(500);
        x.remove();
      } else {
        playSound('element.combine');
        x.setAttribute(
          'style',
          '--offset-x:' + ((combineWith.offsetLeft - getElementMargin()) - parseFloat(x.style.left) + 'px;')
          + '--offset-y:' + ((combineWith.offsetTop - getElementMargin() + 30) - parseFloat(x.style.top) + 'px;')
          + 'left:' + x.style.left + ';'
          + 'top:' + x.style.top
        );
        x.classList.add('combine');
        await delay(350);
        x.remove();
      }
    } else {
      x.remove();
    }
  }
}

async function elementPopAnimation(element: Elem, source: HTMLElement, dest: HTMLElement, isNew: boolean) {
  const dom = ElementDom(element);
  const wrapper = document.createElement('div');
  
  dest.style.pointerEvents = 'none';

  const sourceLeft = source === suggestResultElem ? 36 + 486 - 18 - 160 + 44 : source.offsetLeft;
  const sourceTop = source === suggestResultElem ? (window.innerHeight - 36 - 370 + 30) : source.offsetTop;

  if (source === suggestResultElem) {
    wrapper.classList.add('is-that-hardcoded-shit');
  }

  if (isNew) {
    playSound('element.valid');
  } else {
    playSound('element.valid.rediscover');
  }

  wrapper.classList.add('elem-found-wrapper');
  const offsetX = ((sourceLeft - getElementMargin()) - (dest.offsetLeft - getElementMargin()));
  const offsetY = ((sourceTop - getElementMargin()) - (dest.offsetTop - getElementMargin()));
  const distance = ((offsetX**2 + (4*offsetY)**2) * 0.95) ** (0.4);
  const animationTime = Math.max(260, Math.min(250 + distance, 1000));
  wrapper.setAttribute(
    'style',
    (source === suggestResultElem ? '--offset-scale:' + 2 + ';' : '')
    + '--offset-x:' + offsetX + 'px;'
    + '--offset-y:' + offsetY + 'px;'
    + '--offset-x-zero:' + (offsetX === 0 ? '1' : '0') + ';'
    + 'left:' + (dest.offsetLeft - getElementMargin()) + 'px;'
    + 'top:' + (dest.offsetTop - getElementMargin() + 30) + 'px;'
    + '--calculated-animation-time:' + animationTime + 'ms'
  );
  wrapper.appendChild(dom);
  document.body.appendChild(wrapper);
  await delay(animationTime + 250);
  
  wrapper.remove();
  dest.style.pointerEvents = '';
}

async function elementErrorAnimation(source: HTMLElement) {
  const dom = document.createElement('div');
  dom.className = `elem error`;
  
  const wrapper = document.createElement('div');

  wrapper.classList.add('elem-error-wrapper');
  wrapper.setAttribute(
    'style',
    'left:' + (source.offsetLeft - getElementMargin()) + 'px;'
    + 'top:' + (source.offsetTop - getElementMargin() + 30) + 'px'
  );
  wrapper.appendChild(dom);
  elementContainer.appendChild(wrapper);

  playSound('element.invalid');

  await delay(850);
  wrapper.remove();
}

function formatSuggestDisplay(x: number) {
  const y = Math.round(x * 50 + 50);
  return y + '%';
}

function updateSuggestion() {
  suggestResultElem.value = suggestResult.text;
  suggestResultElem.setAttribute('style', getCSSFromDisplay({ text: '', color: `${[suggestResult.color.base,suggestResult.color.saturation,suggestResult.color.lightness].join('_')}` }));
  document.querySelector('.color-btn.selected')?.classList.remove('selected');
  document.querySelector(`.color-btn[data-color="${suggestResult.color.base}"]`).classList.add('selected');
  (document.querySelector('[data-suggestion-slider="saturation"]') as HTMLInputElement).value = suggestResult.color.saturation.toString();
  (document.querySelector('[data-suggestion-slider-value="saturation"]') as HTMLSpanElement).innerHTML = formatSuggestDisplay(suggestResult.color.saturation);
  (document.querySelector('[data-suggestion-slider="lightness"]') as HTMLInputElement).value = suggestResult.color.lightness.toString();
  (document.querySelector('[data-suggestion-slider-value="lightness"]') as HTMLSpanElement).innerHTML = formatSuggestDisplay(suggestResult.color.lightness);
  (document.querySelector(`.suggest-hint`) as HTMLElement).style.color = suggestResultElem.style.color;
}

// Makes the HTML for an element
export function ElementDom(elem2: Elem) {
  const display = elem2.display;
  const elem = document.createElement('div');
  elem.appendChild(document.createTextNode(display.text));
  elem.className = `elem ${getClassFromDisplay(display)}`;
  return elem;
}

// Adds an element and has most element logic
export async function addElementToGame(element: Elem, sourceLocation?: HTMLElement) {
  if(!element) return;
  console.log(element);
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
    setElementAsOwned(getAPI(), element.id);
  }

  const dom = ElementDom(element);

  dom.addEventListener('click', async(ev) => {
    if (tutorial1visible) {
      document.querySelector('#tutorial1').classList.remove('tutorial-visible');
      tutorial1visible = false;
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
        if(api && !OFFLINE) {
          const [base, saturation, lightness] = randomOf([element, element2]).display.color.split('_');
          
          suggestResult = {
            color: {
              base: base as any,
              lightness: parseFloat(lightness),
              saturation: parseFloat(saturation),
            },
            text:'New Element'
          };
          suggestLeft = element;
          suggestRight = element2;

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
            tutorial2visible = true;
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
      holdingRect = dom.getBoundingClientRect();

      dom.classList.remove('restock');
      void dom.offsetWidth;
      dom.classList.add('restock');

      holdingElement = element;

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
      holdingElementDom = wrapper;
    }
  });

  dom.addEventListener('contextmenu', (ev) => {
    incrementStatistic('infoOpened');
    
    infoContainer.classList.remove('animate-in');

    dropHoldingElement();
    ev.preventDefault();

    dom.style.height = '100px';
    dom.style.top = '-10px';
    dom.scrollIntoView({ block: 'nearest' });
    dom.style.height = '';
    dom.style.top = '';

    const rect = dom.getBoundingClientRect();

    const flipY = rect.top > innerHeight - 400 - 32;
    const flipX = rect.left > innerWidth - 600 - 32;

    infoContainer.style.left = rect.left - 9 - (flipX ? 600 - 80 - 20 : 0) + 'px';
    infoContainer.style.top = rect.top - 10 - (flipY ? 400 - 80 - 20 : 0) + 'px';
    infoContainerContainer.style.flexDirection = flipX ? 'row-reverse' : 'row';
    (infoContainer.querySelector('.elem') as HTMLDivElement).style.alignSelf = flipY ? 'flex-end' : 'flex-start';

    infoContainer.style.display = 'block';
    infoContainer.classList.add('animate-in');
    infoOpen = true;

    Array.from(document.querySelectorAll('[data-element-info]')).forEach(elem => {
      const q = elem.getAttribute('data-element-info');
      const result = '' + query(element, q, 1)[0]
      elem.innerHTML = escapeHTML(result);
    });
    Array.from(document.querySelectorAll('[data-element-plural]')).forEach(elem => {
      const q = elem.getAttribute('data-element-plural');
      const result = '' + query(element, q, 1)[0]
      elem.innerHTML = result === '1' ? '' : 's';
    });
    infoContainer.querySelector('.elem').className = `elem ${getClassFromDisplay(element.display)}`
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
    await elementPopAnimation(element, sourceLocation, dom, true);
    dom.style.opacity = '1';
  }
}

export function InitElementGameUi() {
  elementContainer = document.getElementById('element-game-root');
  infoContainer = document.getElementById('info');
  infoContainerContainer = document.querySelector('#info .info-container');
  suggestContainer = document.querySelector('#suggest');
  suggestResultElem = document.querySelector('.suggest-result-elem')
  suggestLeftElem = document.querySelector('#left-element')
  suggestRightElem = document.querySelector('#right-element')
  suggestHint = document.querySelector('.suggest-hint')
  suggestOtherHeader = document.querySelector('.other-suggestions-header');
  suggestOther1Elem = document.querySelector('[data-suggestion-other="0"]');
  suggestOther1Downvote = document.querySelector('[data-downvote-other="0"]');
  suggestOther2Elem = document.querySelector('[data-suggestion-other="1"]');
  suggestOther2Downvote = document.querySelector('[data-downvote-other="1"]');
  suggestOther3Elem = document.querySelector('[data-suggestion-other="2"]');
  suggestOther3Downvote = document.querySelector('[data-downvote-other="2"]');
  
  document.addEventListener('mousemove', (ev) => {
    if (holdingElementDom) {
      holdingElementDom.style.left = ev.pageX + 'px';
      holdingElementDom.style.top = (ev.pageY + 4) + 'px';
    }
  });
  document.addEventListener('click', (ev: any) => {
    incrementStatistic('clicks')

    if (!(ev.target && ev.target.classList && ev.target.classList.contains('elem'))) {
      dropHoldingElement();
    }
    if (!(ev.path && ev.path.includes(infoContainer))) {
      if (infoOpen) {
        infoContainer.style.display = 'none';
        infoOpen = false;
      }
    }
  });
  document.addEventListener('contextmenu', (ev: any ) => {
    if (ev.path && ev.path.includes(infoContainer)) {
      infoOpen = false;
      infoContainer.style.display = 'none';
      ev.preventDefault();
    } else if (holdingElement) {
      dropHoldingElement();
      ev.preventDefault();
    }
  });
  document.getElementById('element-game-root').addEventListener('scroll', (ev) => {
    infoOpen = false;
    infoContainer.style.display = 'none';
  });
  document.querySelector('.suggest-close').addEventListener('click', (ev) => {
    if(suggestContainer.classList.contains('animate-panel')) {
      suggestContainer.classList.add('animate-out');
      setTimeout(() => {
        suggestContainer.classList.remove('animate-out');
        suggestContainer.classList.remove('animate-panel');
      }, 300);
    } else {
      suggestContainer.classList.remove('animate-prompt');
    }
    document.querySelector('#suggest-block-div').classList.remove('animate-in');

    if (tutorial2visible) {
      document.querySelector('#tutorial2').classList.remove('tutorial-visible');
      tutorial2visible = false;
      setConfigBoolean('tutorial2', true);
      setTimeout(() => {
        (document.querySelector('#tutorial2') as HTMLElement).style.display = 'none';
      }, 250);
    }
  });
  document.querySelector('.suggest-label').addEventListener('click', (ev) => {
    suggestContainer.classList.remove('animate-prompt');
    suggestContainer.classList.add('animate-panel');
    document.querySelector('#suggest-block-div').classList.add('animate-in');
    (document.querySelector('#suggest-block-div') as HTMLElement).style.display = 'block';
    suggestContainer.style.width = '';

    if (tutorial2visible) {
      document.querySelector('#tutorial2').classList.remove('tutorial-visible');
      tutorial2visible = false;
      setConfigBoolean('tutorial2', true);
      setTimeout(() => {
        (document.querySelector('#tutorial2') as HTMLElement).style.display = 'none';
      }, 250);
    }

    getAPI('suggestion').getSuggestions([suggestLeft.id, suggestRight.id]).then((x) => {
      const [e1, e2, e3] = arrayGet3Random(x)
      suggestOther1 = e1;
      suggestOther2 = e2;
      suggestOther3 = e3;

      if(e1) {
        suggestOther1Elem.classList.remove('no');
        suggestOther1Elem.innerHTML = escapeHTML(e1.text);
        suggestOther1Elem.setAttribute('style', getCSSFromDisplay({ text: e1.text, color: `${e1.color.base}_${e1.color.saturation}_${e1.color.lightness}` }));
        suggestOther1Downvote.classList.remove('no');
        suggestOtherHeader.classList.remove('no');
      }
      if(e2) {
        suggestOther2Elem.classList.remove('no');
        suggestOther2Elem.innerHTML = escapeHTML(e2.text);
        suggestOther2Elem.setAttribute('style', getCSSFromDisplay({ text: e2.text, color: `${e2.color.base}_${e2.color.saturation}_${e2.color.lightness}` }));
        suggestOther2Downvote.classList.remove('no');
      }
      if(e3) {
        suggestOther3Elem.classList.remove('no');
        suggestOther3Elem.innerHTML = escapeHTML(e3.text);
        suggestOther3Elem.setAttribute('style', getCSSFromDisplay({ text: e3.text, color: `${e3.color.base}_${e3.color.saturation}_${e3.color.lightness}` }));
        suggestOther3Downvote.classList.remove('no');
      }
    })
  });
  document.querySelector('#suggest-submit').addEventListener('click', async(ev) => {
    const api = getAPI('suggestion');
    if(api) {
      document.querySelector('#suggest-loader').classList.add('animate-in');
      const result = await api.createSuggestion([suggestLeft.id, suggestRight.id], {
        color: suggestResult.color as any,
        text: suggestResult.text,
      })

      document.querySelector('#suggest-loader').classList.remove('animate-in');
      document.querySelector('#suggest-block-div').classList.remove('animate-in');

      if (result.suggestType !== 'failed') {
        if (result.newElements && result.newElements.length > 0) {
          const elems = await Promise.all(result.newElements.map((x) => {
            return api.getElement(x);
          }))
          elems.forEach(x => {
            addElementToGame(x, suggestResultElem);
          });
          suggestResultElem.style.display = 'none';
        }
        setTimeout(() => {
          suggestContainer.classList.add('animate-out');
          setTimeout(() => {
            suggestContainer.classList.remove('animate-out');
            suggestContainer.classList.remove('animate-panel');
          }, 300);
        }, result.newElements ? 400 : 0);
      }

      if(result.suggestType === 'suggest') {
        incrementStatistic('suggestionsCreated')
      }
      if(result.suggestType === 'vote') {
        incrementStatistic('suggestionsVoted')
      }
      incrementStatistic('suggestionsSent')
    }
  });
  const shareBtn = document.querySelector('#suggest-share');
  if ('write' in navigator.clipboard) {
    shareBtn.addEventListener('click', async(ev) => {
      const btn = ev.currentTarget as HTMLButtonElement;
      const root = suggestContainer.querySelector('.suggest-content') as HTMLElement;
      root.classList.add('screenshot')
      btn.setAttribute('disabled', 'true');
      btn.removeAttribute('disabled');
      btn.blur();
      await delayFrame();
      await delayFrame();
      await delayFrame();
      await delayFrame();
      const dataUrl = await DomToImage.toSvg(
        suggestContainer.querySelector('.suggest-content'), {
          style: { top: '0', position: 'relative', border: '1px solid black' },
        } as any
      );
      await delayFrame();
      root.classList.remove('screenshot')
  
      const svgImage = document.createElement('img');
      document.body.appendChild(svgImage);
      svgImage.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = svgImage.clientWidth;
        canvas.height = svgImage.clientHeight;
        const canvasCtx = canvas.getContext('2d');
        canvasCtx.drawImage(svgImage, 0, 0);
        svgImage.remove();
        canvas.toBlob((blob) => {
          // fuck typescript
          (navigator.clipboard as any).write([new (window as any).ClipboardItem({ [blob.type]: blob })]);
        }, 'image/png');
      };
      svgImage.src = dataUrl;
    });
  } else {
    shareBtn.setAttribute('disabled', 'true');
  }
  const suggestTextarea = document.querySelector('textarea.elem') as HTMLTextAreaElement;
  suggestTextarea.addEventListener('input', (x) => {
    suggestTextarea.value = (suggestTextarea.value.slice(0, 50).replace(/^ |( ) +/, '$1')).split(' ').map(capitalize).join(' ');
    while(suggestTextarea.scrollHeight > 80) {
      if(suggestTextarea.value.length === 0) {
        return;
      }
      suggestTextarea.value = suggestTextarea.value.slice(0, -1);
    }
    suggestResult.text = suggestTextarea.value;
  });
  suggestTextarea.addEventListener('focus', (x) => {
    suggestHint.classList.remove('animate-in');
  });
  document.querySelectorAll('.color-btn').forEach((elem) => {
    const color = elem.getAttribute('data-color');
    elem.addEventListener('click', () => {
      suggestResult.color.base = color as any;
      updateSuggestion();
    });
  });
  document.querySelectorAll('[data-suggestion-slider]').forEach((x: HTMLInputElement) => {
    const prop = x.getAttribute('data-suggestion-slider');
    x.addEventListener('input', () => {
      suggestResult.color[prop] = parseFloat(x.value);
      updateSuggestion();
    });
  });
  document.querySelector('#left-element').addEventListener('click', () => {
    const [base, saturation, lightness] = suggestLeft.display.color.split('_');
    
    suggestResult.color = {
      base: base as any,
      saturation: parseFloat(saturation),
      lightness: parseFloat(lightness),
    };
    suggestResult.text = suggestLeft.display.text;
    updateSuggestion();
  });
  suggestOther1Elem.addEventListener('click', () => {
    suggestResult = suggestOther1;
    updateSuggestion();
  })
  suggestOther2Elem.addEventListener('click', () => {
    suggestResult = suggestOther2;
    updateSuggestion();
  })
  suggestOther3Elem.addEventListener('click', () => {
    suggestResult = suggestOther3;
    updateSuggestion();
  })
  suggestOther1Downvote.addEventListener('click', () => {
    suggestOther1Elem.classList.add('no');
    suggestOther1Downvote.classList.add('no');
    const api = getAPI('suggestion');
    api.downvoteSuggestion([suggestLeft.id, suggestRight.id], suggestOther1);
  })
  suggestOther2Downvote.addEventListener('click', () => {
    suggestOther2Elem.classList.add('no');
    suggestOther2Downvote.classList.add('no');
    const api = getAPI('suggestion');
    api.downvoteSuggestion([suggestLeft.id, suggestRight.id], suggestOther2);
  })
  suggestOther3Downvote.addEventListener('click', () => {
    suggestOther3Elem.classList.add('no');
    suggestOther3Downvote.classList.add('no');
    const api = getAPI('suggestion');
    api.downvoteSuggestion([suggestLeft.id, suggestRight.id], suggestOther3);
  })
  document.querySelector('#right-element').addEventListener('click', () => {
    const [base, saturation, lightness] = suggestRight.display.color.split('_');

    suggestResult.color = {
      base: base as any,
      saturation: parseFloat(saturation),
      lightness: parseFloat(lightness),
    };
    suggestResult.text = suggestRight.display.text;
    updateSuggestion();
  });
  document.querySelector('[data-suggestion-slider-value="saturation"]').addEventListener('click', () => {
    suggestResult.color.saturation = 0;
    updateSuggestion();
  });
  document.querySelector('[data-suggestion-slider-value="lightness"]').addEventListener('click', () => {
    suggestResult.color.lightness = 0;
    updateSuggestion();
  });
}
export async function InitElementNews() {
  const rc = getAPI('recentCombinations');
  if(rc) {
    const combinations = await rc.getRecentCombinations(30);
    const newsItems = await Promise.all(combinations.map(async(x) => {
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
    }));

    const sidebar = document.querySelector('#element-sidebar')
    newsItems.forEach(x => sidebar.appendChild(x));
  }
}
export function ClearElementGameUi() {
  elementContainer.querySelectorAll('[data-category],h3').forEach((x) => {
    x.remove();
  });
  const categoryDiv = document.createElement('div');
  categoryDiv.setAttribute('data-category', 'none');
  elementContainer.appendChild(categoryDiv);
  document.querySelector('#tutorial1').classList.remove('tutorial-visible');
  document.querySelector('#tutorial2').classList.remove('tutorial-visible');
  tutorial1visible = false;
  tutorial2visible = false;

  if (!getConfigBoolean('tutorial1', false)) {
    tutorial1visible = true;
    document.querySelector('#tutorial1').classList.add('tutorial-visible');
    (document.querySelector('#tutorial1') as HTMLElement).style.display = 'block';
  }
}
export function DisposeElementGameUi() {
}
