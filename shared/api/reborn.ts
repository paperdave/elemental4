import { Elem, ElementalBaseAPI, ElementalColorPalette, ElementalLoadingUi, ElementalRules, ServerStats, Suggestion, SuggestionRequest, SuggestionResponse } from "../elem";
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
      const sorted = ids.map(x => parseInt(x)).sort((a, b) => a - b);
      const elem = await fetch(this.baseUrl + '/api/get-recipe/' + sorted.join('/')).then(x => x.json());
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

  getSuggestionColorInformation() {
    return {
      type: 'palette',
      palette: [
        { id: 'blue', color: { base: 'blue', lightness: 0, saturation: 0 } },
        { id: 'dark-brown', color: { base: 'dark-brown', lightness: 0, saturation: 0 } },
        { id: 'orange', color: { base: 'orange', lightness: 0, saturation: 0 } },
        { id: 'dark-blue', color: { base: 'dark-blue', lightness: 0, saturation: 0 } },
        { id: 'navy-blue', color: { base: 'navy-blue', lightness: 0, saturation: 0 } },
        { id: 'light-grey', color: { base: 'light-grey', lightness: 0, saturation: 0 } },
        { id: 'dark-purple', color: { base: 'dark-purple', lightness: 0, saturation: 0 } },
        { id: 'dark-red', color: { base: 'dark-red', lightness: 0, saturation: 0 } },
        { id: 'grey', color: { base: 'grey', lightness: 0, saturation: 0 } },
        { id: 'dark-green', color: { base: 'dark-green', lightness: 0, saturation: 0 } },
        { id: 'green', color: { base: 'green', lightness: 0, saturation: 0 } },
        { id: 'yellow', color: { base: 'yellow', lightness: 0, saturation: 0 } },
        { id: 'dark-yellow', color: { base: 'dark-yellow', lightness: 0, saturation: 0 } },
        { id: 'white', color: { base: 'white', lightness: 0, saturation: 0 } },
        { id: 'brown', color: { base: 'brown', lightness: 0, saturation: 0 } },
        { id: 'black', color: { base: 'black', lightness: 0, saturation: 0 } },
        { id: 'red', color: { base: 'red', lightness: 0, saturation: 0 } },
        { id: 'purple', color: { base: 'purple', lightness: 0, saturation: 0 } },
        { id: 'pink', color: { base: 'pink', lightness: 0, saturation: 0 } },
        { id: 'magenta', color: { base: 'magenta', lightness: 0, saturation: 0 } },
      ]
    };
  }

  async getSuggestions(ids: string[]): Promise<Suggestion<'palette'>[]> {
    return [];
  }
  
  async downvoteSuggestion(ids: string[], suggestion: SuggestionRequest<'palette'>): Promise<void> {
    return null;
  }
  
  async createSuggestion(ids: string[], suggestion: SuggestionRequest<'palette'>): Promise<SuggestionResponse> {
    return {
      suggestType: 'failed',
    };
  }
}
