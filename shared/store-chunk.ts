import { createJoinedQueue } from "./async-queue-exec";
import { CacheMap } from "./cache";
import { delay } from "./shared";
import { Store, IStore } from "./store";

function getGroupId(s: string) {
  for(var i = 0, h = 0; i < s.length; i++)
    h = Math.imul(17, h) + s.charCodeAt(i) | 0;
  return (Math.abs(h) % 256).toString(16);
}

export class ChunkedStore extends IStore {
  private store: Store;
  private dbCache = new CacheMap<string, Record<string, any>>({ ttl: 5, checkTime: 60 });
  private dbWritingPaused: boolean = false;
  private dbDirty: Record<string, boolean> = {};
  private entryWriteCounter: number = 0;

  constructor(storeName: string) {
    super();
    this.store = new Store(storeName)
  }
  
  bulkTransfer(cb: () => Promise<void>) {
    return new Promise((res, rej) => {
      this.dbWritingPaused = true;
      cb().then(() => {
        this.dbWritingPaused = false;
        this.writeAllGroups().then(() => {
          res();
        })
      }).catch((err) => {
        rej(err)
      });
    })
  }

  private createQueue = createJoinedQueue();

  private writeGroup = this.createQueue(async(gid: string) => {
    if(this.dbWritingPaused) return
    if(!this.dbDirty[gid]) return;
    console.log('GSet')
    await this.store.set('g' + gid, this.dbCache.get(gid));
    console.log('GSetFinish')
    this.dbCache.touch(gid);
  });
  private writeAllGroups = this.createQueue(async() => {
    return Promise.all(Object.keys(this.dbDirty).filter(gid => this.dbDirty[gid]).map(async(gid) => {
      await this.store.set('g' + gid, this.dbCache.get(gid));
      this.dbDirty[gid] = false;
    }));
  });

  get = this.createQueue(async(id: string) => {
    const gid = getGroupId(id)
    if (this.dbCache.has(gid)) {
      this.dbCache.touch(gid);
      return this.dbCache.get(gid)[id];
    } else {
      const group = (await this.store.get('g' + gid) || {}) as any;
      this.dbCache.set(gid, group);
      this.dbDirty[gid] = true;
      return group[id];
    }
  });
  set = this.createQueue(async(id: string, entry: any) => {
    const gid = getGroupId(id)
    if (this.dbCache.has(gid)) {
      this.dbCache.touch(gid);
      const group = this.dbCache.get(gid);
      group[id] = entry;
    } else {
      const group = (await this.store.get('g' + gid) || {}) as any;
      this.dbCache.set(gid, group);
      this.dbDirty[gid] = true;
      group[id] = entry;
    }
    this.writeGroup(gid);
    // if we batch A TON of set calls, ui can lag a lot, so we request a ui update every 1000 calls
    this.entryWriteCounter++;
    if(this.entryWriteCounter > 1000) {
      this.entryWriteCounter = 0;
      await delay(0);
    }
  });
  clear = this.createQueue(async() => {
    await this.dbCache.deleteAll();
    await this.store.clear();
  })
  keys = this.createQueue(async() => {
    return (await Promise.all(
      (await this.store.keys())
        .map(async(key) => {
          return Object.keys(await this.store.get(key));
        })
    )).flat();
  })
  del = this.createQueue(async(id: string) => {
    const gid = getGroupId(id)
    if (this.dbCache.has(gid)) {
      this.dbCache.touch(gid);
      const group = this.dbCache.get(gid);
      delete group[id];
    } else {
      const group = (await this.store.get('g' + gid) || {}) as any;
      this.dbCache.set(gid, group);
      this.dbDirty[gid] = true;
      delete group[id];
    }
    this.writeGroup(gid);
    // if we batch A TON of set calls, ui can lag a lot, so we request a ui update every 1000 calls
    this.entryWriteCounter++;
    if(this.entryWriteCounter > 1000) {
      this.entryWriteCounter = 0;
      await delay(0);
    }
  })
  length(): Promise<number> {
    throw new Error("Method not implemented.");
  }
}
