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
  listItem: OptionListItemDOM,
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
  const select = document.createElement('select');
  const label = document.createElement('option');
  label.innerHTML = escapeHTML(item.label);
  label.disabled = true;
  label.value = "default";
  select.appendChild(label);
  for (let i = 0; i < item.choices.length; i++) {
    const option = document.createElement('option');
    option.innerHTML = escapeHTML(item.choices[i].label);
    option.value = item.choices[i].id;
    select.appendChild(option);
  }
  if (!item.defaultValue) {
    select.value = "default";
  } else {
    select.value = item.defaultValue;
  }
  select.onchange = (e) => {
    item.onChange(select.value);
  }
  return select;
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
export function OptionListItemDOM(v: SimpleState<string[]>, item: OptionsItem<'listItem'>) {
  const div = document.createElement('div');
  div.classList.add("theme-item");

  const info = document.createElement('div');
  info.classList.add("theme-info");

  const title = document.createElement('div');
  title.classList.add("theme-title")
  const titleText = document.createElement('strong');
  titleText.innerHTML = escapeHTML(item.title);
  title.appendChild(titleText);

  const desc = document.createElement('div');
  desc.classList.add("theme-description");
  desc.innerHTML = escapeHTML(item.label);

  info.appendChild(title);
  info.appendChild(desc);
  div.appendChild(info); 

  for (let i = 0; i < item.choices.length; i++) {
    const button = document.createElement("button");
    button.classList.add("huge");
    button.innerHTML = escapeHTML(item.choices[i].label);
    if (i != item.choices.length-1) {
      button.style.marginRight = "5px";
    }
    button.onclick = function() { item.onChange(item.choices[i].id) };
    div.appendChild(button);
  }

  return div;
}
