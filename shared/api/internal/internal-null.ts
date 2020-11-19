import { ElementalBaseAPI } from "../../elem";

export const IsNullAPI = Symbol('IsNullAPI');

export class InternalNullAPI extends ElementalBaseAPI {  
  static type = 'internal:null'

  public [IsNullAPI] = true;
  
  async open() { return true; }
  async close(): Promise<void> {}
  async getStats() { return {} }
  async getElement(id: string) { return null; }
  async getCombo(ids: string[]): Promise<string[]> { return [] }
  async getStartingInventory(): Promise<string[]> { return []; }
}
