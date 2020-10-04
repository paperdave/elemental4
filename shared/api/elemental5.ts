import { Elem, ElementalBaseAPI, ElementalLoadingUi, ElementalRules, ServerStats } from "../elem";

export class Elemental5API extends ElementalBaseAPI {
  static type = 'elemental5';

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
