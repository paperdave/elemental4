import { Elem, ElementalBaseAPI, ElementalLoadingUi, ElementalRules, ServerStats } from "../elem";

export class BlankAPI extends ElementalBaseAPI {  
  async open(ui?: ElementalLoadingUi): Promise<boolean> {
    return true;
  }
  async close(): Promise<void> {

  }
  async getStats(): Promise<ServerStats> {
    return {
      totalElements: 0
    }
  }
  async getElement(id: string): Promise<Elem> {
    return null;
  }
  async getCombo(ids: string[]): Promise<string[]> {
    return [];
  }
  async getStartingInventory(): Promise<string[]> {
    return ['1','2','3','4'];
  }

}
