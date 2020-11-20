import { delayFrame } from "../../../shared/shared";
import { setConfigBoolean } from "../savefile";
import { arrayGet3Random, escapeHTML } from "../../../shared/shared";
import { getCSSFromDisplay } from "../element-color";
import { getAPI } from "../api";;
import { setSuggestOthers, suggestOtherHeader, suggestOther1Downvote, suggestOther1Elem, suggestOther2Elem, suggestOther3Elem, suggestOther2Downvote, suggestOther3Downvote, suggestLeft, suggestRight, setTutorial2Visible, suggestContainer, tutorial2visible, suggestResult, suggestResultElem } from "../element-game";
import { addElementToGame } from "../add-element";
import { incrementStatistic } from "../statistics";
import DomToImage from 'dom-to-image';
import { capitalize } from "@reverse/string";

export function closeSuggestionMenu() {
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
    setTutorial2Visible(false);
    setConfigBoolean('tutorial2', true);
    setTimeout(() => {
      (document.querySelector('#tutorial2') as HTMLElement).style.display = 'none';
    }, 250);
  }
}

export function openSuggestionMenu() {
  suggestContainer.classList.remove('animate-prompt');
    suggestContainer.classList.add('animate-panel');
    document.querySelector('#suggest-block-div').classList.add('animate-in');
    (document.querySelector('#suggest-block-div') as HTMLElement).style.display = 'block';
    suggestContainer.style.width = '';

    if (tutorial2visible) {
      document.querySelector('#tutorial2').classList.remove('tutorial-visible');
      setTutorial2Visible(false);
      setConfigBoolean('tutorial2', true);
      setTimeout(() => {
        (document.querySelector('#tutorial2') as HTMLElement).style.display = 'none';
      }, 250);
    }

    getAPI('suggestion').getSuggestions([suggestLeft.id, suggestRight.id]).then((x) => {
      const [e1, e2, e3] = arrayGet3Random(x)
      setSuggestOthers(e1, e2, e3);

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
}

export async function submitSuggestion() {
  const api = getAPI('suggestion');
    if(api) {
      const suggestTextarea = document.querySelector('textarea.elem') as HTMLTextAreaElement;
      suggestTextarea.value = (suggestTextarea.value.slice(0, 50).replace(/^ |( ) +/, '$1')).split(' ').map(capitalize).join(' ');
      while(suggestTextarea.scrollHeight > 80) {
        if(suggestTextarea.value.length === 0) {
          return;
        }
        suggestTextarea.value = suggestTextarea.value.slice(0, -1);
      }
      suggestResult.text = suggestTextarea.value;
      
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
}

export async function shareSuggestion(ev) {
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
    
}
