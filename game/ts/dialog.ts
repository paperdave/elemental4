import { delay, escapeHTML } from "../../shared/shared";
import { Emitter } from '@reverse/emitter';
import { playSound } from "./audio";
import { Converter } from 'showdown';

export async function animateDialogOpen(root: HTMLElement) {
  if (document.hasFocus()) {
    playSound('dialog.open');
  } else {
    window.focus()
    playSound('dialog.attention');
  }
  root.classList.add('dialog-open');
  root.classList.add('dialog-opening');
  (root.firstElementChild as HTMLElement)?.focus()
  await delay(200);
  root.classList.remove('dialog-opening');
}

export async function animateDialogClose(root: HTMLElement) {
  playSound('dialog.close');
  root.classList.add('dialog-closing');
  await delay(200);
  root.classList.remove('dialog-closing');
  root.classList.remove('dialog-open');
}

export function DialogDOM() {
  const root = document.createElement('div');
  const content = document.createElement('div');
  root.classList.add('dialog');
  content.classList.add('dialog-content');
  root.appendChild(content);
  return { root, content };
}

export interface DialogInstanceOptions {
  title?: string;
  content: string | HTMLElement | (string | HTMLElement)[];
  buttons?: DialogButton[];
  className?: string;
}

export interface DialogButton {
  label: string;
  id: any;
}

export interface DialogInput {
  id: string;
  placeholder?: string;
  default?:string;
  required:boolean;
  type?: "text"|"password"|"email";
  disabled?: boolean;
}

type DialogPart = DialogInput | string;

export interface DialogInstance extends Emitter {
  close: (arg: any) => Promise<void>;
}

export function createDialogInstance(opt: DialogInstanceOptions) {
  const { title, content: argContent, buttons = [{ id: true, label: 'OK' }], className = 'dialog-generic-content' } = opt;
  const emitter = new Emitter() as DialogInstance;
  const { root, content } = DialogDOM();
  content.className += ' ' + className;
  document.body.appendChild(root);

  if (title) {
    const h2 = document.createElement('h2');
    h2.innerHTML = escapeHTML(title);
    content.appendChild(h2);
  }

  if (typeof argContent === 'string') {
    const p = document.createElement('p');
    p.innerHTML = escapeHTML(argContent);
    content.appendChild(p);
  } else {
    if (Array.isArray(argContent)) {
      argContent.forEach(x => {
        if (typeof x === 'string') {
          const p = document.createElement('p');
          p.innerHTML = escapeHTML(x);
          content.appendChild(p);
        } else {
          content.appendChild(x);
        }
      });
    } else {
      content.appendChild(argContent);
    }
  }

  if (buttons.length > 0) {
    const buttonsDiv = document.createElement('div')
    buttonsDiv.classList.add('dialog-buttons');
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const btn = document.createElement('button');
      btn.innerHTML = escapeHTML(button.label);
      btn.addEventListener('click', () => {
        emitter.close(button.id);
      });
      if(i !== 0) {
        btn.classList.add('secondary');
      }
      buttonsDiv.appendChild(btn)
    }
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    buttonsDiv.appendChild(spacer);
    content.appendChild(buttonsDiv);
  }

  delay(25).then(async() => {
    animateDialogOpen(root);
    await delay(10);
    emitter.emit('ready')
  });

  emitter.close = async(arg: any) => {
    emitter.emit('close', arg)
    await animateDialogClose(root);
    await delay(200)
    root.remove();
  };
  
  return emitter;
}
export function SimpleDialog(opt: DialogInstanceOptions): Promise<any> {
  const instance = createDialogInstance(opt);
  return new Promise((done) => instance.addListener('close', done));
}

export function asyncAlert(title: string, text: string): Promise<void> {
  return SimpleDialog({
    title,
    content: text,
  })
}

export function asyncConfirm(title: string, text: string, trueButton = 'OK', falseButton = 'Cancel'): Promise<boolean> {
  return SimpleDialog({
    title,
    content: text,
    buttons: [
      trueButton && {
        id: true,
        label: trueButton
      },
      trueButton && {
        id: false,
        label: falseButton
      },
    ].filter(Boolean)
  })
}

export function asyncPrompt(title: string, text: string, defaultInput?: string, confirmButton = 'OK', cancelButton = 'Cancel', big?: boolean): Promise<undefined|string> {
  let dialog: DialogInstance;
  const formElement = document.createElement('form');
  formElement.classList.add('dialog-form')
  const input = document.createElement('input');
  formElement.onsubmit = (ev) => {
    ev.preventDefault();
    dialog.close(true);
  }
  big && input.classList.add('big')
  formElement.appendChild(input);
  input.type = 'text';
  // input.autofocus = true;
  input.value = defaultInput || '';
  dialog = createDialogInstance({
    title,
    content: [
      text,
      formElement
    ],
    buttons: [
      confirmButton && {
        id: true,
        label: confirmButton
      },
      cancelButton && {
        id: false,
        label: cancelButton
      },
    ].filter(Boolean)
  });

  dialog.on('ready', () => {
    input.focus();
  });

  return new Promise((done) => {
    input.focus();
    dialog.on('close', (x) => {
      done(x ? input.value : undefined);
    })
  })
}

export function asyncDialog(title: string, parts: DialogPart[], buttons?: DialogButton[]): Promise<Record<string, string>> {
  let dialog: DialogInstance;

  const formElement = document.createElement('form');
  formElement.classList.add('dialog-form');
  formElement.onsubmit = (ev) => {
    ev.preventDefault();
    dialog.close(true);
  }

  var inputs: Record<string, HTMLInputElement> = {};
  var conv = new Converter();
  var firstInput: string = null;
  for (var i = 0; i < parts.length; i++) {
    if (typeof parts[i] == "string") {
      var div = document.createElement("div");
      div.innerHTML = conv.makeHtml(parts[i]);
      formElement.appendChild(div);
    } else {
      var inputPart = parts[i] as DialogInput;
      inputs[inputPart.id] = document.createElement("input");
      inputs[inputPart.id].type = inputPart.type;
      inputs[inputPart.id].required = inputPart.required;
      inputs[inputPart.id].value = inputPart.default || "";
      inputs[inputPart.id].placeholder = inputPart.placeholder;
      inputs[inputPart.id].disabled = inputPart.disabled;
      formElement.appendChild(inputs[inputPart.id]);
      if (!firstInput) {
        firstInput = inputPart.id;
      }
    }
  }

  dialog = createDialogInstance({
    title,
    content: [formElement],
    buttons: buttons,
  });

  dialog.on('ready', () => {
    inputs[firstInput].focus();
  });

  return new Promise((done) => {
    inputs[firstInput].focus();
    dialog.on('close', (x) => {
      console.log(x);
      let out: Record<string, string> = {};
      for (var key in inputs) {
        out[key] = inputs[key].value;
      }
      out["button"] = x;
      done(out);
    })
  })
}
