import { Emitter } from "@reverse/emitter";
import { ElementalPopupBackend } from "../../shared/elem";
import { animateDialogClose, animateDialogOpen, DialogDOM } from "./dialog";

export function createFramePopup(url?: string): Promise<ElementalPopupBackend> {
  return new Promise((done) => {
    const { root, content } = DialogDOM();

    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', url ? '' : '');
    frame.src = url || 'about:blank';

    const emitter = new Emitter() as any as ElementalPopupBackend;
    emitter.postMessage = (message) => {

    };
    emitter.close = () => {
      animateDialogClose(root);
    }

    animateDialogOpen(root);

    // frame.onload = () => {
    //   done({
    //     window: frame.contentWindow,
    //     close: closeDialog
    //   })
    // }
  });
}
