import { Elem, ElementalBaseAPI, ElementalLoadingUi, ElementalRules, ServerStats, ElementalColorPalette } from "../../elem";

const mainPalette = [
  "white",
  "black",
  "grey",
  "brown",
  "red",
  "orange",
  "yellow",
  "yellow-green",
  "green",
  "aqua",
  "blue",
  "dark-blue",
  "purple",
  "magenta",
  "hot-pink",
]
export class DebugAllColorsAPI extends ElementalBaseAPI {
  async open(ui?: ElementalLoadingUi): Promise<boolean> { return true; }
  async close(): Promise<void> {}
  async getStats(): Promise<ServerStats> { return {} }

  async getElement(id: string): Promise<Elem> {
    return {
      display: {
        text: id,
        color: id,
        categoryName: mainPalette.includes(id) ? 'Main Palette' : 'Extended Palette (Derived from Main Palette)',
      },
      id
    };
  }
  
  async getCombo(ids: string[]): Promise<string[]> {
    return [];
  }
  
  async getStartingInventory(): Promise<string[]> {
    return [
      'white',
      'black',
      'light-grey',
      'grey',
      'dark-grey',
      'brown',
      'dark-brown',
      'red',
      'dark-red',
      'orange',
      'dark-orange',
      'yellow',
      'dark-yellow',
      'yellow-green',
      'dark-yellow-green',
      'green',
      'dark-green',
      'aqua',
      'dark-aqua',
      'blue',
      'dark-blue',
      'navy-blue',
      'purple',
      'dark-purple',
      'magenta',
      'dark-magenta',
      'pink',
      'hot-pink',
      'dark-hot-pink',
    ];
  }
}
