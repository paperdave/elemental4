// i was doing some stuff to localForage and trying to use a simpler library, but that failed.
// however the api was just way too nice looking, so i rewrote it.

import { createInstance } from "localforage";

export class Store {
  private localForage: LocalForage;

  constructor(storeName: string) {
    this.localForage = createInstance({
      name: 'ELEMENTAL',
      storeName: storeName,
    })
  }

  get(key: string): Promise<any> {
    return this.localForage.getItem(key);
  }
  set(key: string, item: any) {
    return this.localForage.setItem(key, item);
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
}
