import { OptionsItem } from "../../elem";
import { Nv7SingleAPI } from "./nv7single";

export function sortUI(api: Nv7SingleAPI): OptionsItem[] {
  let items: OptionsItem[] = [];
  items.push({
    type: "select",
    label: "Sort By",
    choices: [
      {
        label: "Likes",
        id: "likes",
      },
      {
        label: "Date",
        id: "date",
      },
      {
        label: "A-Z",
        id: "az",
      },
      {
        label: "Z-A",
        id: "za",
      },
    ],
    defaultValue: api.saveFile.get("kind"),
    onChange: async (id: string) => {
      api.saveFile.set("kind", id);
      await api.ui.reloadSelf();
    }
  })
  items.push({
    type: "string",
    label: "Query: ",
    defaultValue: api.saveFile.get("search", ""),
    onChange: (text: string) => {
      api.saveFile.set("search", text);
    }
  })
  items.push({
    type: "button",
    label: "Search",
    onChange: async () => {
      await api.ui.reloadSelf();
    }
  })
  return items;
}