import { delay } from "../../shared/shared";
import { capitalize } from "@reverse/string";
import { getConfigBoolean, setConfigBoolean } from "./savefile";
import { Elem, Suggestion } from "../../shared/elem";
import { getAPI } from "./api";
import { E4Suggestion } from "../../shared/elemental4-types";
import { incrementStatistic } from "./statistics";
import { playSound } from "./audio";
import { endTreeCanvas } from "./tree";
import { IsNullAPI } from "../../shared/api/internal/internal-null";
import { updateSuggestion } from "./utils";
import { getElementMargin } from "./utils";
import { closeSuggestionMenu, openSuggestionMenu, shareSuggestion, submitSuggestion } from "./element-game/listeners";

export let elementContainer: HTMLElement;
export let infoContainer: HTMLElement;
export let infoContainerContainer: HTMLElement;
export let suggestContainer: HTMLElement;
export let suggestResultElem: HTMLTextAreaElement;
export let suggestLeftElem: HTMLElement;
export let suggestRightElem: HTMLElement;
export let suggestHint: HTMLElement;

export let suggestOtherHeader: HTMLElement;
export let suggestOther1Elem: HTMLElement;
export let suggestOther1Downvote: HTMLElement;
export let suggestOther2Elem: HTMLElement;
export let suggestOther2Downvote: HTMLElement;
export let suggestOther3Elem: HTMLElement;
export let suggestOther3Downvote: HTMLElement;
export let suggestOther1: Suggestion<'dynamic-elemental4'>;
export let suggestOther2: Suggestion<'dynamic-elemental4'>;
export let suggestOther3: Suggestion<'dynamic-elemental4'>;

export let tutorial1visible = false;
export let tutorial2visible = false;

let infoOpen = false;
export let holdingElement: Elem = null;
export let holdingElementDom: HTMLElement = null;
export let holdingRect: DOMRect;

export let suggestLeft: Elem;
export let suggestRight: Elem;
export let suggestResult: E4Suggestion;

export async function dropHoldingElement(combineWith?: HTMLElement) {
  holdingElement = null;
  if (holdingElementDom) {
    const x = holdingElementDom;
    holdingElementDom = null;

    incrementStatistic('elementsDropped');

    x.setAttribute(
      'style',
      'left:' + (parseFloat(x.style.left)) + 'px;'
      + 'top:' + (parseFloat(x.style.top) - 30 + elementContainer.scrollTop) + 'px'
    );
    elementContainer.appendChild(x);

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
          + '--offset-y:' + ((combineWith.offsetTop - getElementMargin()) - parseFloat(x.style.top) + 'px;')
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
    const path = ev.path || (ev.composedPath && ev.composedPath());
    if (!(path && path.includes(infoContainer))) {
      if (infoOpen) {
        infoContainer.style.display = 'none';
        infoOpen = false;
        endTreeCanvas();
      }
    }
  });
  document.addEventListener('contextmenu', (ev: any ) => {
    if (ev.path && ev.path.includes(infoContainer)) {
      infoOpen = false;
      endTreeCanvas();
      infoContainer.style.display = 'none';
      ev.preventDefault();
    } else if (holdingElement) {
      dropHoldingElement();
      ev.preventDefault();
    }
  });
  document.getElementById('element-game-root').addEventListener('scroll', (ev) => {
    infoOpen = false;
    endTreeCanvas();
    infoContainer.style.display = 'none';
  });
  document.querySelector('.suggest-close').addEventListener('click', (ev) => {closeSuggestionMenu()});
  document.querySelector('.suggest-label').addEventListener('click', (ev) => {openSuggestionMenu()});
  document.querySelector('#suggest-submit').addEventListener('click', async(ev) => {await submitSuggestion()});
  const shareBtn = document.querySelector('#suggest-share');
  if ('write' in navigator.clipboard) {
    shareBtn.addEventListener('click', async(ev) => {await shareSuggestion(ev)});
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

  document.querySelectorAll('[data-info-tab]').forEach((elem) => {
    elem.addEventListener('click', () => {
      const tab = elem.getAttribute('data-info-tab');

      infoContainer.querySelectorAll('.info-tab,.info-section')
        .forEach(x => x.classList.remove('selected'));

      infoContainer.querySelector('.info-section-' + tab).classList.add('selected');
      infoContainer.querySelector('[data-info-tab="'  + tab + '"]').classList.add('selected');
    })
  })
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

  if (!getConfigBoolean('tutorial1', false) && !getAPI()[IsNullAPI]) {
    tutorial1visible = true;
    document.querySelector('#tutorial1').classList.add('tutorial-visible');
    (document.querySelector('#tutorial1') as HTMLElement).style.display = 'block';
  }
}
export function DisposeElementGameUi() {
}
export function setTutorial1Visible(val: boolean) {tutorial1visible = val}
export function setTutorial2Visible(val: boolean) {tutorial2visible = val}
export function setSuggestResult(suggestresult: E4Suggestion, element1: Elem, element2: Elem) {
  suggestResult = suggestresult;
  suggestLeft = element1;
  suggestRight = element2;
}
export function setInfoOpen(val: boolean) {infoOpen = val;}
export function setHoldingRect(val: DOMRect) {holdingRect = val;}
export function setHoldingElement(val: Elem) {holdingElement = val;}
export function setHoldingElementDom(val: HTMLElement) {holdingElementDom = val;}
export function setSuggestOthers(suggestOth1: Suggestion<'dynamic-elemental4'>, suggestOth2: Suggestion<'dynamic-elemental4'>, suggestOth3: Suggestion<'dynamic-elemental4'>) {
  suggestOther1 = suggestOth1;
  suggestOther2 = suggestOth2;
  suggestOther3 = suggestOth3;
}
