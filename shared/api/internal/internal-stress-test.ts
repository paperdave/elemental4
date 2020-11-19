import { Elem, ElementalBaseAPI, ElementalLoadingUi, ServerStats } from "../../elem";

const palette = [
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
];

export class InternalStressTestAPI extends ElementalBaseAPI {
  async open(ui?: ElementalLoadingUi): Promise<boolean> { return true; }
  async close(): Promise<void> {}
  async getStats(): Promise<ServerStats> { return {} }

  async getElement(id: string): Promise<Elem> {
    return {
      display: {
        text: 'Element',
        color: palette[parseInt(id) % palette.length],
        categoryName: 'Elements'
      },
      id
    };
  }
  
  async getCombo(ids: string[]): Promise<string[]> {
    return ids.slice(0, 1);
  }
  
  async getStartingInventory(): Promise<string[]> {
    return Array(this.config.elements).fill(null).map((_, i) => i.toString());
  }
}
