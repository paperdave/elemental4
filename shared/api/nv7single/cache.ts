import { Nv7SingleAPI } from "./nv7single";

export class Cache  {
  private db: IDBDatabase;
  public api: Nv7SingleAPI;

  async init(api: Nv7SingleAPI): Promise<void> {
    var request: IDBOpenDBRequest = window.indexedDB.open("Nv7Single", api.saveFile.get("dbVers", 1));
    this.api = api;

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

      request.onupgradeneeded = async (event: any) => {
        this.db = event.target.result;
        var objectStore = this.db.createObjectStore("default", { keyPath: "index" });
        objectStore.createIndex("index", "index", { unique: true });

        objectStore.transaction.oncomplete = async (e: any) => {
          await this.add("default", "Air", {
            name: "Air",
            color: "blue_0_0",
            comment: "The first element!",
            parents: [],
          });
          await this.add("default", "Earth", {
            name: "Earth",
            color: "brown_0_-1",
            comment: "The second element!",
            parents: [],
          });
          await this.add("default", "Fire", {
            name: "Fire",
            color: "orange_0_0",
            comment: "The third element!",
            parents: [],
          });
          await this.add("default", "Water", {
            name: "Water",
            color: "dark-blue_0_0",
            comment: "The third element!",
            parents: [],
          });
          resolve();
        };
      }
    });
  }

  newPack(name: string): Promise<void> {
    let version = this.api.saveFile.get("dbVers", 1);
    version++;
    this.api.saveFile.set("dbVers", version);
    this.db.close();
    var request: IDBOpenDBRequest = window.indexedDB.open("Nv7Single", version);
    return new Promise<void>(async (resolve, reject) => {
      request.onerror = function(event) {
        reject(event.target);
      };

      request.onupgradeneeded = (event: any) => {
        this.db = event.target.result;
        var objectStore = this.db.createObjectStore(name, { keyPath: "index" });
        objectStore.createIndex("index", "index", { unique: true });

        objectStore.transaction.oncomplete = function(e: any) {
          resolve();
        };
      }
    });
  }

  async add(pack: string, index: string, val: any): Promise<void> {
    var transaction: IDBTransaction = this.db.transaction([pack], "readwrite");
    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = function(event) {
        resolve();
      };
      transaction.onerror = function(event) {
        reject(event.target);
      };

      var objectStore: IDBObjectStore = transaction.objectStore(pack);
      objectStore.put({"index": index, "val": val});
    });
  }

  async get(pack: string, index: string): Promise<any> {
    var transaction: IDBTransaction = this.db.transaction([pack], "readwrite");
    return new Promise<any>((resolve, reject) => {
      transaction.onerror = function(event) {
        reject(event.target);
      };

      var objectStore: IDBObjectStore = transaction.objectStore(pack);
      var request = objectStore.get(index);
      request.onsuccess = function(event: any) {
        if (request.result == null) {
          resolve(null);
        } else {
          resolve(request.result.val);
        }
      };
    });
  }

  async getAll(pack: string): Promise<Record<string, any>> {
    var transaction: IDBTransaction = this.db.transaction([pack], "readwrite");
    return new Promise<any>((resolve, reject) => {
      transaction.onerror = function(event) {
        reject(event.target);
      };

      var objectStore: IDBObjectStore = transaction.objectStore(pack);
      var request = objectStore.getAll();
      request.onsuccess = function(event: any) {
        let output: Record<string, any> = {}
        if (request.result == null) {
          resolve(output);
        } else {
          for (let i = 0; i < request.result.length; i++) {
            output[request.result[i].index] = request.result[i].val;
          }
          resolve(output);
        }
      };
    });
  }
}
