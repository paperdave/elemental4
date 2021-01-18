import { ElementalLoadingUi, OptionsItem } from "../../elem";
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
    onChange: (id: string) => {
      console.log(id);
    }
  })
  return items;
}