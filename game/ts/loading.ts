import { createFramePopup } from "./iframe";

export function createLoadingUi() {
  let timer: number;
  let textDom: HTMLElement;
  let text2: string;
  let progress2: number;

  const dom = document.createElement('div');
  dom.classList.add('quick-loader');
  document.body.appendChild(dom);

  const self = {
    popup: createFramePopup,
    show: () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      textDom = document.createElement('main');
      textDom.innerHTML = text2 + (progress2 !== undefined ? '<div class="progress" style="width:' + (progress2 * 100) + '%"></div>' : '');
      dom.appendChild(textDom);
    },
    status: (text: string, progress: number) => {
      if(!textDom) {
        if(!timer) {
          timer = setTimeout(() => {
            self.show()
          }, 200) as any;
        }
        text2 = text;
        progress2 = progress;
      } else {
        textDom.innerHTML = text + (progress !== undefined ? '<div class="progress" style="width:' + (progress * 100) + '%"></div>' : '');
      }
    },
    dispose: () => {
      if (timer !== undefined) clearTimeout(timer);
      dom.remove();
    }
  };
  return self;
}
