import { Elem, ElementalBaseAPI, ElementalLoadingUi, ElementalRules, ServerStats } from "../../shared/elem";

export class SingleplayerAPI extends ElementalBaseAPI {
  private loadedPackIds: string[];
  
  async open(ui?: ElementalLoadingUi): Promise<boolean> {
    this.loadedPackIds = this.saveFile.get<string[]>('activePacks') || ['base', 'elemental2'];
    
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
    return {
      id,
      display: {
        text: `Element #${id}`,
        color: 'blue',
        categoryName: 'elements'
      }
    };
  }
  async getCombo(ids: string[]): Promise<string[]> {
    return [];
  }
  async getStartingInventory(): Promise<string[]> {
    return ['1','2','3','4'];
  }
}
