import { OptionsSection, OptionsItem } from '../../elem';
import { PackInfo } from './types';
import { Nv7SingleAPI } from './nv7single';

export function createOptions(api: Nv7SingleAPI): OptionsSection[] {
  let items: OptionsItem[] = [];
  let packs = api.saveFile.get("packs", []) as PackInfo[]
  for (let i = 0; i < packs.length; i++) {
    items.push({
      type: "listItem",
      label: packs[i].description,
      title: packs[i].title,
      choices: [
        {
          label: "Select",
          id: "select",
        }
      ],
      onChange: (id: string) => {
        api.saveFile.set("pack", packs[i].id);
        api.pack = packs[i].id;
        api.ui.reloadSelf();
      }
    })
  }
  return [
    { 
      title: "Your Packs",
      desc: "These are the installed packs on your computer:",
      items: items,
    }
  ];
}