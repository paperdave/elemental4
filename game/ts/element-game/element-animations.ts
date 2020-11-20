import { suggestResultElem, elementContainer } from "../element-game"
import { ElementDom } from "../utils";
import { Elem } from "../../../shared/elem";
import { playSound } from "../audio";
import { delay } from "../../../shared/shared";
import { getElementMargin } from "../utils";

export async function elementPopAnimation(element: Elem, source: HTMLElement, dest: HTMLElement, isNew: boolean) {
  const dom = ElementDom(element);
  const wrapper = document.createElement('div');
  
  dest.style.pointerEvents = 'none';

  const sourceLeft = source === suggestResultElem ? 36 + 486 - 18 - 160 + 44 : source.offsetLeft;
  const sourceTop = source === suggestResultElem ? (window.innerHeight - 36 - 370) : source.offsetTop;

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
    + 'top:' + (dest.offsetTop - getElementMargin()) + 'px;'
    + '--calculated-animation-time:' + animationTime + 'ms'
  );
  wrapper.appendChild(dom);
  elementContainer.appendChild(wrapper);
  await delay(animationTime + 250);
  
  wrapper.remove();
  dest.style.pointerEvents = '';
}

export async function elementErrorAnimation(source: HTMLElement) {
  const dom = document.createElement('div');
  dom.className = `elem error`;
  
  const wrapper = document.createElement('div');

  wrapper.classList.add('elem-error-wrapper');
  wrapper.setAttribute(
    'style',
    'left:' + (source.offsetLeft - getElementMargin()) + 'px;'
    + 'top:' + (source.offsetTop - getElementMargin()) + 'px'
  );
  wrapper.appendChild(dom);
  elementContainer.appendChild(wrapper);

  playSound('element.invalid');

  await delay(850);
  wrapper.remove();
}
