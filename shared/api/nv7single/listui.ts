import { ElementalLoadingUi, OptionsItem } from "../../elem";
import { Nv7SingleAPI } from "./nv7single";
import { PackInfo } from "./types";

export function  listUI(api: Nv7SingleAPI): OptionsItem[] {
  let items: OptionsItem[] = [];
  for (let i = 0; i < api.items.length; i++) {
    let item = api.items[i];
    items.push({
      type: "listItem",
      label: item.description,
      title: item.title,
      choices: [
        {
          label: "Like",
          id: "like",
        },
        {
          label: "Install",
          id: "install",
        }
      ],
      onChange: async (id: string) => {
        if (id == "like") {
          await api.ui.loading(async (ui: ElementalLoadingUi) => {
            ui.status("Liking Pack", 0);
            let res = await fetch(api.prefix + "single_like/" + item.id + "/" + item.uid);
            ui.status("Liking Pack", 0.5);
            let text = await res.text();
            if (text != "") {
              ui.status("Showing Error", 0);
              await api.ui.alert({
                "text": text,
                "title": "Error",
              });
            }
          });
          await api.ui.reloadSelf();
        }
      }
    })
  }
  return items;
}

export async function initListUI(api: Nv7SingleAPI, ui: ElementalLoadingUi): Promise<void> {
  ui.status("Getting Pack List", 0)
  let res = await fetch(api.prefix + "single_list/" + api.saveFile.get("kind", "likes"));
  if (res.status == 500) {
    ui.status("Loading Error", 0);
    let text = await res.text();
    ui.status("Showing Error", 0);
    await api.ui.alert({
      "text": text,
      "title": "Error",
    });
    return
  }
  ui.status("Getting Pack List", 0.5)
  api.items = await res.json();
}