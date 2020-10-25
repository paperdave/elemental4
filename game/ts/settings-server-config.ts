import { ElementalBaseAPI, OptionsItem, OptionsMenuAPI, OptionsSection, OptionTypes } from "../../shared/elem";
import { escapeHTML } from "../../shared/shared";
import { SimpleState } from '@reverse/state';

export function disposeServerConfigGui() {
  
}
export function reRenderServerConfigGui(api: OptionsMenuAPI) {
  disposeServerConfigGui();
  const sections = api.getOptionsMenu()
  sections.forEach((section) => {

  })
}
export function OptionSimpleState(api: ElementalBaseAPI, item: OptionsItem) {
  return new SimpleState(0);
}
export function OptionsSectionDOM(api: ElementalBaseAPI, section: OptionsSection) {
  const root = document.createElement('div');
  const header = document.createElement('h1');
  header.innerHTML = escapeHTML(section.title);
  section.items.map(x => OptionsItemDOM(OptionSimpleState(api, x), x));
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

}
export function OptionNumberDOM(v: SimpleState<number>, item: OptionsItem<'number'>) {

}
export function OptionCheckboxDOM(v: SimpleState<boolean>, item: OptionsItem<'checkbox'>) {

}
export function OptionSwitchDOM(v: SimpleState<boolean>, item: OptionsItem<'switch'>) {

}
export function OptionSelectDOM(v: SimpleState<string>, item: OptionsItem<'select'>) {

}
export function OptionCheckboxGroupDOM(v: SimpleState<string[]>, item: OptionsItem<'checkboxGroup'>) {

}
export function OptionButtonDOM(v: SimpleState<undefined>, item: OptionsItem<'button'>) {

}
export function OptionLabelDOM(v: SimpleState<undefined>, item: OptionsItem<'label'>) {

}
