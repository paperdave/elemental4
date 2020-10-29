import { Elem, ElementalBaseAPI, ElementalColorPalette, ElementalLoadingUi, ElementalRules, ServerSavefileAPI, ServerSavefileEntry, ServerStats } from "../elem";

const colorMap: Record<string, ElementalColorPalette> = {
  tan: 'brown',
  white: 'white',
  black: 'black',
  grey: 'grey',
  brown: 'dark-brown',
  dark_red: 'dark-red',
  red: 'red',
  orange: 'orange',
  dark_yellow: 'dark-yellow',
  yellow: 'yellow',
  green: 'green',
  aqua: 'aqua',
  light_blue: 'blue',
  blue: 'dark-blue',
  dark_blue: 'navy-blue',
  purple: 'purple',
  magenta: 'magenta',
  pink: 'pink'
}

export class Elemental5API extends ElementalBaseAPI implements ServerSavefileAPI {
  static type = 'elemental5';

  private accounts: ServerSavefileEntry[];
  private token: string;
  
  async open(ui?: ElementalLoadingUi): Promise<boolean> {
    this.accounts = this.saveFile.get('accounts', []);
    
    if (this.accounts.length === 0) {
      while (true) {
        let token = await this.ui.prompt({
          title: 'Elemental 5 Login',
          text: 'Go to [dev.elemental5.net](https://dev.elemental5.net) and copy your API Token to login.',
          defaultInput: '',
          confirmButton: 'Log In',
        });
        if (!token) {
          return false;
        }
        
        const response = await fetch(this.baseUrl + '/validate_user_string?user_string=' + token).then((x) => x.json())
        if (response.valid !== "true") {
          this.saveFile.set('user_string', 'dummy');
          continue
        }
        this.accounts = [
          {
            id: token,
            name: 'User'
          }
        ];
        this.saveFile.set('accounts', this.accounts);
        break
      }
    }

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
    const elem = (await this.store.get(encodeURIComponent(id))) || null;
    if(elem) {
      return {
        id: elem.name,
        display: {
          text: elem.name,
          color: colorMap[elem.color],
        },
        stats: {
          creators: [elem.pioneer]
        }
      }
    }
  }
  async getCombo(ids: string[]): Promise<string[]> {
    const combo = (await this.store.get(ids.map(x => encodeURIComponent(x)).join('+')));
    if(combo) {
      return combo;
    } else {
      const res = await fetch(this.baseUrl + '/combine_elements?user_string=' + this.token + '&element1=' + encodeURIComponent(ids[0])+ '&element2=' + encodeURIComponent(ids[1])).then(x => x.json());
      if (res.type === 'already_has_element') {
        return [];
      } else if (res.type === 'invalid_user_elements') {
        return [];
      } else if (res.type === 'combined') {
        await this.store.set(encodeURIComponent(res.result.name), res.result);
        await this.store.set(ids.map(x => encodeURIComponent(x)).join('+'), [res.result.name]);
        return [res.result.name];
      }
      return []
    }
  }
  async getStartingInventory(): Promise<string[]> {
    return [];
  }
  getSaveFiles(): ServerSavefileEntry[] {
    return this.accounts;
  }
  async readSaveFileElements(id: string): Promise<string[]> {
    this.token = id;
    const elementCount = this.saveFile.get('element_count.' + id, 0);
    const update = await fetch(this.baseUrl + '/sync_elements?user_string=' + id + '&num_elements=' + elementCount).then(x => x.text());
    
    if (update !== 'up_to_date') {
      const json = JSON.parse(update);
      await Promise.all(json.map((entry) => {
        return this.store.set(encodeURIComponent(entry.name), entry);
      }));
      const inventory = json.map(x => x.name);
      this.saveFile.set('inventory.' + id, inventory)
      this.saveFile.set('element_count.' + id, json.length);
      return inventory;
    } else {
      return this.saveFile.get('inventory.' + id);
    }
  }
  async writeNewElementToSaveFile(id: string, elementId: string) {
    this.saveFile.set('inventory.' + id, [...new Set(this.saveFile.get('inventory.' + id, []).concat(elementId).filter(Boolean))]);
  }
  canCreateSaveFile(name: string): boolean {
    return false;
  }
  createNewSaveFile(name: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  canDeleteSaveFile(id: string): boolean {
    return false;
  }
  deleteSaveFile(id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  canRenameSaveFile(id: string, name: string): boolean {
    return false;
  }
  renameSaveFile(id: string, name: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
