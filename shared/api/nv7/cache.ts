import { Element } from "./types";

export class Cache  {
  private db: IDBDatabase;

  async init(): Promise<void> {
    var request: IDBOpenDBRequest = window.indexedDB.open("Nv7Elemental", 3);

    return new Promise<void>((resolve, reject) => {
      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        this.db.onerror = function(e: any) {
          reject(e.target);
        };
        resolve();
      }; 

      request.onerror = function(event) {
        reject(event.target);
      };

      request.onupgradeneeded = (event: any) => {
        var finished = 0;
        this.db = event.target.result;
      
        var objectStore = this.db.createObjectStore("Elements", { keyPath: "name" });
        objectStore.createIndex("name", "name", { unique: true });

        objectStore.transaction.oncomplete = function(e: any) {
          finished++;
          if (finished == 2) {
            resolve();
          }
        };

        objectStore = this.db.createObjectStore("Found", { keyPath: "name" });
        objectStore.createIndex("name", "name", { unique: true });

        objectStore.transaction.oncomplete = function(e: any) {
          finished++;
          if (finished == 2) {
            resolve();
          }
        };
      };
    });
  }

  async store(element: Element): Promise<void> {
    var transaction: IDBTransaction = this.db.transaction(["Elements"], "readwrite");
    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = function(event) {
        resolve();
      };
      transaction.onerror = function(event) {
        reject(event.target);
      };

      var objectStore: IDBObjectStore = transaction.objectStore("Elements");
      objectStore.put(element);
    });
  }

  async get(name: string): Promise<Element> {
    var transaction: IDBTransaction = this.db.transaction(["Elements"], "readwrite");
    return new Promise<Element>((resolve, reject) => {
      transaction.onerror = function(event) {
        reject(event.target);
      };

      var objectStore: IDBObjectStore = transaction.objectStore("Elements");
      var request = objectStore.get(name);
      request.onsuccess = function(event: any) {
        resolve(request.result);
      };
    });
  }

  async getAllElements(): Promise<Element[]> {
    var transaction: IDBTransaction = this.db.transaction(["Elements"], "readwrite");
    return new Promise<Element[]>((resolve, reject) => {
      transaction.onerror = function(event) {
        reject(event.target);
      };

      var objectStore: IDBObjectStore = transaction.objectStore("Elements");
      var request = objectStore.getAll();
      request.onsuccess = function(event: any) {
        resolve(request.result);
      };
    });
  }
}
