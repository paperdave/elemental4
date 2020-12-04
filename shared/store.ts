// i was doing some stuff to localForage and trying to use a simpler library, but that failed.
// however the api was just way too nice looking, so i rewrote it.

import localForage from "./localForage";

export abstract class IStore {
  abstract get(key: string): Promise<any>;
  abstract set(key: string, item: any);
  abstract del(key: string);
  abstract keys();
  abstract length();
  abstract clear();
  abstract bulkTransfer(x: () => Promise<void>);
}

export class Store extends IStore {
  private localForage: typeof localForage;
  private storeName: string;

  constructor(storeName: string) {
    super();
    this.storeName = storeName;
    this.localForage = localForage.createInstance({
      name: 'ELEMENTAL',
      storeName: storeName,
    })
  }

  get(key: string): Promise<any> {
    return this.localForage.getItem(key);
  }
  set(key: string, item: any) {
    return this.localForage.setItem(key, item).catch((e) => {
      console.log('Error Writing to Store');
      console.error(e);
    });
  }
  del(key: string) {
    return this.localForage.removeItem(key);
  }
  keys() {
    return this.localForage.keys();
  }
  length() {
    return this.localForage.length();
  }
  clear() {
    return this.localForage.clear();
  }
  bulkTransfer(x: () => Promise<void>) {
    return x();
  }
}
