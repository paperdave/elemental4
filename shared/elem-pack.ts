import { Elem, ElementalBaseAPI } from "./elem";
import { elementNameToStorageID } from "./shared";
import { Store } from "./store";

export interface ElementalPackParserOptions {
  store: Store;
  packId: string;
}
export type ImportedPack = Pick<ElementalBaseAPI, "getCombo" | "getElement" | "getStartingInventory">;
export type ElemIdOptional = Omit<Elem, "id"> & Partial<Pick<Elem, "id">>;

export abstract class ElementalPackParser {
  protected packId: string;
  private store: Store;
  
  constructor({ store, packId }: ElementalPackParserOptions) {
    this.store = store;
    this.packId = packId;
  }

  /** Converts element name to an ID */
  protected elementNameToStorageID = elementNameToStorageID;

  /** Adds an element to your pack. ID is optional. */
  protected insertElement(elem: ElemIdOptional) {
    
  }

  /** Adds a combination to your pack. Use namespaces to refer to other packs. */
  protected insertCombination(ids: string[], output: string) {

  }

  /** Imports a pack */
  protected importPack(id: string): Promise<ImportedPack> {
    return null;
  }

  /**
    * Parse data contents, each file provided in the pack meta is provided in the contents array.
    * Plugin must use this.store.set to store it's contents. The specific store provided will be a ChunkedStore,
    * so you shouldn't need to worry about extremely large entries causing an extreme slowdown.
    * 
    * When storing elements, you should use the elementNameToStorageId(), as that is how elements will
    * be looked up.
    */
  abstract async parse(contents: string[]): Promise<void>;
}
