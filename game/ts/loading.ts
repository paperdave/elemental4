import { createFramePopup } from "./iframe";

export function createLoadingUi() {
  let timer: number;
  let dom: HTMLElement;
  let textDom: HTMLElement;
  let text2: string;
  let progress2: number;
  const self = {
    popup: createFramePopup,
    show: () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      dom = document.createElement('div');
      dom.classList.add('quick-loader');
      textDom = document.createElement('main');
      textDom.innerHTML = text2 + (progress2 !== undefined ? '<div class="progress" style="width:' + (progress2 * 100) + '%"></div>' : '');
      dom.appendChild(textDom);
      document.body.appendChild(dom);
    },
    status: (text: string, progress: number) => {
      if(!dom) {
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
      if (dom) dom.remove();
    }
  };
  return self;
}
