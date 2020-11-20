import { suggestResultElem, suggestResult } from "./element-game";
import { getCSSFromDisplay, getClassFromDisplay } from "./element-color";
import { Elem } from "../../shared/elem";
import { capitalize } from "@reverse/string";

export function formatSuggestDisplay(x: number) {
  const y = Math.round(x * 50 + 50);
  return y + '%';
}

export function getElementMargin() {
  const x = document.querySelector('.elem') as HTMLElement;
  if(x) {
    const y = parseFloat(getComputedStyle(x).marginLeft);
    return y;
  }
  return 8 
}

export function updateSuggestion() {
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

export function formatCategory(x: string) {
  return x.split('-').map(capitalize).join(' ')
}
