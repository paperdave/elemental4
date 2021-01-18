import { OptionsSection, OptionsItem } from '../../elem';
import { PackInfo } from './types';
import { Nv7SingleAPI } from './nv7single';

export function createOptions(api: Nv7SingleAPI): OptionsSection[] {
  let packs = api.saveFile.get("packs", []) as PackInfo[]
  let items: OptionsItem[] = [
    {
      type: "button",
      label: "New Pack",
      onChange: async () => {
        let title = await api.ui.prompt({
          title: "Pack Name",
          text: "Enter the name of the pack below!"
        });
        let desc = await api.ui.prompt({
          title: "Pack Description",
          text: "Enter the description of the pack below!"
        });
        if (title == "" || desc == "") {
          return;
        }
        let info: PackInfo = {
          title: title,
          description: desc,
          id: encodeURIComponent(title.toLowerCase()),
        }
        if (packs.includes(info)) {
          await api.ui.alert({
            title: "Pack Already Exists",
            text: "That pack already exists!",
          })
          return;
        }
        api.pack = info.id;
        await api.cache.newPack(api.pack);
        packs.push(info);
        api.saveFile.set("pack", api.pack);
        api.saveFile.set("packs", packs);
        await api.cache.add(api.pack, "Air", {
          name: "Air",
          color: "blue_0_0",
          comment: "The first element!",
          parents: [],
        });
        await api.cache.add(api.pack, "Earth", {
          name: "Earth",
          color: "brown_0_-1",
          comment: "The second element!",
          parents: [],
        });
        await api.cache.add(api.pack, "Fire", {
          name: "Fire",
          color: "orange_0_0",
          comment: "The third element!",
          parents: [],
        });
        await api.cache.add(api.pack, "Water", {
          name: "Water",
          color: "dark-blue_0_0",
          comment: "The third element!",
          parents: [],
        });
        let found = api.saveFile.get("found", {"default": ["Air", "Earth", "Water", "Fire"]});
        found[api.pack] = ["Air", "Earth", "Fire", "Water"];
        api.saveFile.set("found", found);
        await api.ui.reloadSelf();
      }
    }
  ];
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