import { Elem, ElementalBaseAPI, ElementalColorPalette, ElementalLoadingUi, ElementalRules, ServerStats } from "../elem";
import { sortCombo } from "../shared";
import { ChunkedStore } from "../store-chunk";

const colorMap: Record<string, ElementalColorPalette> = {
  sky: 'blue',
  brown: 'dark-brown',
  orange: 'orange',
  blue: 'dark-blue',
  navy: 'navy-blue',
  silver: 'light-grey',
  purple: 'dark-purple',
  maroon: 'dark-red',
  gray: 'grey',
  green: 'dark-green',
  lime: 'green',
  yellow: 'yellow',
  olive: 'dark-yellow',
  white: 'white',
  tan: 'brown',
  black: 'black',
  red: 'red',
  lavender: 'purple',
  pink: 'pink',
  magenta: 'magenta',
}
export class RebornElementalAPI extends ElementalBaseAPI {
  static type = 'reborn';
  
  private clientId: string;
  
  async open(ui?: ElementalLoadingUi): Promise<boolean> {
    this.clientId = this.config.googleAuth.clientId
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
    const find = await this.store.get(id);
    if (!find) {
      const elem = await fetch(this.baseUrl + '/api/get-full-element/' + id).then(x => x.json());
      if (Array.isArray(elem) && elem.length === 0) {
        return null;
      } else {
        const value: Elem = {
          id: elem.id.toString(),
          display: {
            color: colorMap[elem.color],
            text: elem.name
          },
          createdOn: elem.createdOn,
          stats: {
            creators: [elem.suggestedBy, elem.pioneer],
            comments: [
              {
                comment: elem.pioneerNote,
                author: elem.pioneer,
              }
            ],
          }
        }
        await this.store.set(elem.id.toString(), value);
        return value;
      }
    }
    return find;
  }
  async getCombo(ids: string[]): Promise<string[]> {
    const find = await this.store.get(ids.join('+'));
    if (!find) {
      const elem = await fetch(this.baseUrl + '/api/get-recipe/' + sortCombo(...ids).join('/')).then(x => x.json());
      if (Array.isArray(elem) && elem.length === 0) {
        return [];
      } else {
        await this.store.set(elem.id.toString(), {
          id: elem.id.toString(),
          display: {
            color: colorMap[elem.color],
            text: elem.name
          },
          stats: null
        } as Elem);
        return [elem.id.toString()]
      }
    }
    return [find];
  }
  async getStartingInventory(): Promise<string[]> {
    return ['1','2','3','4'];
  }
}
