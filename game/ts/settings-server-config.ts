import { ElementalBaseAPI, OptionsItem, OptionsMenuAPI, OptionsSection, OptionTypes } from "../../shared/elem";
import { escapeHTML } from "../../shared/shared";
import { SimpleState } from '@reverse/state';

let restartRequired = false;

export function disposeServerConfigGui() {
  const root = document.getElementById('server-config');
  root.innerHTML = '';
}
export function reRenderServerConfigGui(api: OptionsMenuAPI & ElementalBaseAPI) {
  disposeServerConfigGui();
  const root = document.getElementById('server-config');
  const sections = api.getOptionsMenu()
  sections.forEach((section) => {
    root.appendChild(OptionsSectionDOM(api, section));
  });
}
export function OptionSimpleState(api: ElementalBaseAPI, item: OptionsItem) {
  let v = item.saveFileProp
    && (api as any).saveFile.get(item.saveFileProp)
    || item.value
    || item.defaultValue;

  const state = new SimpleState(v);

  let ignore = false;
  state.onChange((newValue) => {
    if (ignore) {
      ignore = false;
      return;
    }

    if (!item.validator || item.validator(newValue)) {
      v = newValue;
      if (item.requiresRestart) {
        restartRequired = true;
      }
      if (item.saveFileProp) {
        (api as any).saveFile.set(item.saveFileProp, v)
      }
      item.onChange(v);
    } else {
      ignore = true;
      state.set(v);
    }
  });

  return state;
}
export function OptionsSectionDOM(api: ElementalBaseAPI, section: OptionsSection) {
  const root = document.createElement('div');
  const header = document.createElement('h1');
  header.innerHTML = escapeHTML(section.title);
  root.appendChild(header);
  if(section.desc) {
    const p = document.createElement('p');
    p.innerHTML = escapeHTML(section.desc);
    root.appendChild(p);
  }
  section.items.forEach(x => root.appendChild(OptionsItemDOM(OptionSimpleState(api, x), x)));
  return root;
}
const optionsItemTypeMap: Record<keyof OptionTypes, Function> = {
  string: OptionStringDOM,
  number: OptionNumberDOM,
  checkbox: OptionCheckboxDOM,
  switch: OptionSwitchDOM,
  select: OptionSelectDOM,
  checkboxGroup: OptionCheckboxGroupDOM,
  button: OptionButtonDOM,
  label: OptionLabelDOM,
}
export function OptionsItemDOM(v: SimpleState<any>, item: OptionsItem) {
  return optionsItemTypeMap[item.type](v, item);
}
export function OptionStringDOM(v: SimpleState<string>, item: OptionsItem<'string'>) {
  const root = document.createElement('div');

  const label = document.createElement('span');
  label.classList.add('text-field-label');
  label.innerHTML = escapeHTML(item.label);
  root.appendChild(label);
  
  const input = document.createElement('input');
  root.appendChild(input);
  input.addEventListener('change', (x) => {
    v.set(input.value);
  });
  v.onChange((newValue) => {
    input.value = newValue.toString();
  });
  input.value = v.get();

  return root;
}
export function OptionNumberDOM(v: SimpleState<number>, item: OptionsItem<'number'>) {
  return document.createTextNode(JSON.stringify(item));
}
export function OptionCheckboxDOM(v: SimpleState<boolean>, item: OptionsItem<'checkbox'>) {
  return document.createTextNode(JSON.stringify(item));
}
export function OptionSwitchDOM(v: SimpleState<boolean>, item: OptionsItem<'switch'>) {
  return document.createTextNode(JSON.stringify(item));
}
export function OptionSelectDOM(v: SimpleState<string>, item: OptionsItem<'select'>) {
  return document.createTextNode(JSON.stringify(item));
}
export function OptionCheckboxGroupDOM(v: SimpleState<string[]>, item: OptionsItem<'checkboxGroup'>) {
  return document.createTextNode(JSON.stringify(item));
}
export function OptionButtonDOM(v: SimpleState<undefined>, item: OptionsItem<'button'>) {
  const button = document.createElement('button');
  button.innerHTML = escapeHTML(item.label);
  button.onclick = item.onChange;
  return button;
}
export function OptionLabelDOM(v: SimpleState<undefined>, item: OptionsItem<'label'>) {
  const p = document.createElement('p');
  p.innerHTML = escapeHTML(item.label);
  return p;
}
