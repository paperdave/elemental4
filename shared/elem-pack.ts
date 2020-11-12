// todo: wrap head around inter-pack dependencies

import { Elem, ElementalBaseAPI } from "./elem";
import { elementNameToStorageID } from "./shared";
import { IStore } from "./store";

export interface ElementalPackParserOptions {
  store: IStore;
  id: string;
}
export interface PackMetadata {
  id: string;
  name?: string;
  icon?: string;
  description?: string;
  version?: string;
  author?: string;
}
export type ImportedPack = Pick<ElementalBaseAPI, "getCombo" | "getElement" | "getStartingInventory"> & {
  stats: {

  }
};
export type ElemIdOptional = Omit<Elem, "id"> & Partial<Pick<Elem, "id">>;

function addNamespace(x, namespace) {
  if (!x.includes(':')) return x;
  return namespace + ':' + x
}
function removeNamespace(x, namespace) {
  if (!x.includes(':')) return x.split(':')[1];
  return namespace + ':' + x
}

export abstract class ElementalPackParser {
  protected packId: string;
  private store: IStore;
  private meta: PackMetadata;
  
  constructor({ store, id }: ElementalPackParserOptions) {
    this.store = store;
    this.packId = id;
    this.meta = { id };
  }

  /** Converts element name to an ID */
  protected elementNameToStorageID = elementNameToStorageID;

  /** Adds an element to your pack. ID is optional. */
  protected async insertElement(elem: Elem) {
    const nsId = this.packId + ':' + elem.id;
    const computedId = elementNameToStorageID(elem.display.text);
    elem.stats = elem.stats || {};
    elem.stats.alternateIds = (elem.stats.alternateIds || []).concat(nsId);
    this.store.set('e.' + computedId, elem);
    this.store.set('n.' + nsId, computedId);
  }

  /** Adds a combination to your pack. Use namespaces to refer to other packs. */
  protected async insertCombination(ids: string[], output: string) {
    const newIds = ids.map(x => addNamespace(x, this.packId));
    const isInternal = newIds.every(x => x.startsWith)

    if(isInternal) {
      this.store.set('c.' + newIds.join('+'), addNamespace(output, this.packId));
    } else {
      // this.store.set('c.' + , addNamespace(output, this.packId));
    }
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
  abstract async parse(contents: string): Promise<void>;
}
