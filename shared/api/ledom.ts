import { Elem, ElementalBaseAPI, ElementalLoadingUi, ElementalRules, ServerStats } from "../elem";

export class LedomElementalAPI extends ElementalBaseAPI {
  static type = 'ledom';
  
  async open(ui?: ElementalLoadingUi): Promise<boolean> {
    // call /api/universe/elements/count
    // call /api/universe/elements?pack_id=default&last_known_id=0
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
    return [];
  }
}
