// i was doing some stuff to localForage and trying to use a simpler library, but that failed.
// however the api was just way too nice looking, so i rewrote it.
import {getServiceWorker }from '../game/ts/service-worker';

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
  private storeName: string;

  constructor(storeName: string) {
    super();
    this.storeName = storeName;
  }

  get(key: string): Promise<any> {
    return new Promise((resolve) => {
      const return_id = Math.random().toString().substr(2);
      const worker = getServiceWorker();

      worker.postMessage({
        type: 'elem4-worker:get',
        return_id,
        store: this.storeName,
        key,
      });

      navigator.serviceWorker.addEventListener('message', function cb(event) {
        if (event.data.return_id === return_id) {
          navigator.serviceWorker.removeEventListener('message', cb);
          resolve(event.data.return_value);
        }
      });
    });
  }
  set(key: string, item: any) {
    getServiceWorker().postMessage({
      type: 'elem4-worker:set',
      store: this.storeName,
      key,
      item
    });
  }
  del(key: string) {
    getServiceWorker().postMessage({
      type: 'elem4-worker:del',
      store: this.storeName,
      key,
    });
  }
  keys() {
    return new Promise((resolve) => {
      const return_id = Math.random().toString().substr(2);
      const worker = getServiceWorker();

      worker.postMessage({
        type: 'elem4-worker:keys',
        return_id,
        store: this.storeName,
      });

      navigator.serviceWorker.addEventListener('message', function cb(event) {
        if (event.data.return_id === return_id) {
          navigator.serviceWorker.removeEventListener('message', cb);
          resolve(event.data.return_value);
        }
      });
    });
  }
  length() {
    return new Promise((resolve) => {
      const return_id = Math.random().toString().substr(2);
      const worker = getServiceWorker();

      worker.postMessage({
        type: 'elem4-worker:length',
        return_id,
        store: this.storeName,
      });

      navigator.serviceWorker.addEventListener('message', function cb(event) {
        if (event.data.return_id === return_id) {
          navigator.serviceWorker.removeEventListener('message', cb);
          resolve(event.data.return_value);
        }
      });
    });
  }
  clear() {
    getServiceWorker().postMessage({
      type: 'elem4-worker:clear',
      store: this.storeName,
    });
  }
  bulkTransfer(x: () => Promise<void>) {
    return x();
  }
  static removeStore(storeName: string) {
    throw new Error('Not Implemented');
  }
}
