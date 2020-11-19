import { Elem, ElementalBaseAPI, ElementalLoadingUi, ElementalRules, ServerStats } from "../../shared/elem";
import { BlankPackParser } from "../../shared/pack-format/blank";
import { IStore } from "../../shared/store";
import { ChunkedStore } from "../../shared/store-chunk";

export class SingleplayerAPI extends ElementalBaseAPI {
  private loadedPackIds: string[];

  private data: Record<string, IStore>;
  
  async open(ui?: ElementalLoadingUi): Promise<boolean> {
    console.log('holy hell you actually called the singleplayer api somehow')
    return false;

    this.loadedPackIds = this.saveFile.get<string[]>('activePacks') || ['base', 'elemental2'];
    
    const packList: IStore[] = [];

    const id = 'test';
    const store = new ChunkedStore('pack:' + id);
    const pack = new BlankPackParser({
      id,
      store,
    });
    packList.push(store);
    store.bulkTransfer(async() => {
      [''].forEach(str => {
        pack.parse(str);
      })
    });

    await this.store.bulkTransfer(async() => {
      await Promise.all(packList.map(async(store) => {
        return (await store.keys()).map(async(key) => {
          console.log(key);
          this.store.set(key, await store.get(key))
        });
      }));
    });

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
    return await this.store.get('e.' + id);
  }
  async getCombo(ids: string[]): Promise<string[]> {
    const elements = await Promise.all(ids.map(e => this.getElement(e)));

    const namespacesInCommon = elements.slice(1).reduce((ids, elem) => {
      return elem.stats.alternateIds.map(y => y.split(':')[0]).filter(x => ids.includes(x));
    }, elements[0].stats.alternateIds.map(y => y.split(':')[0]));
    
    const results = namespacesInCommon.length ? await Promise.all(namespacesInCommon.map(async(namespace) => {
      return this.store.get('c.' + elements.map(x => x.stats.alternateIds.find(y => y.startsWith(namespace))).join('+'));
    })) : await this.store.get('c.' + elements.map(x => x.id));
    
    console.log(namespacesInCommon);
    console.log(results);

    return [];
  }
  async getStartingInventory(): Promise<string[]> {
    return [
      'fire',
      'air',
      'water',
      'earth',
    ];
  }
}
