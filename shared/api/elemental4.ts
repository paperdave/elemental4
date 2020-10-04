import {debounce} from '@reverse/debounce';
import { CacheMap } from '../cache';
import { CustomPaletteAPI, Elem, ElementalBaseAPI, ElementalColorPalette, ElementalLoadingUi, ElementalRules, ServerStats, Suggestion, SuggestionAPI, SuggestionRequest, SuggestionResponse, applyColorTransform, ThemedPaletteEntry, OptionsSection, OptionsItem, RecentCombinationsAPI, RecentCombination, OfflinePlayAPI } from "../elem";
import { E4SuggestionResponse, Entry } from '../elemental4-types';
import { fetchWithProgress } from '../fetch-progress';
import { delay, randomString } from '../shared';
import Color from 'color';
import { Store } from '../store';
import { SimpleEmitter } from '@reverse/emitter';
import io from 'socket.io-client';
import { ChunkedStore } from '../store-chunk';
import { createQueueExec } from '../async-queue-exec';

const ONE_DAY = 24*60*60*1000;

function formatDate(x: Date) {
  return `${x.getFullYear()}-${(x.getMonth()+1).toString().padStart(2,'0')}-${x.getDate().toString().padStart(2, '0')}`;
}

interface DBMeta {
  lastEntry: number;
  lastUpdated: number;
  recentCombos: RecentCombination[];
  version: number;
}

export class Elemental4API
  extends ElementalBaseAPI
  implements CustomPaletteAPI,
             SuggestionAPI<'dynamic-elemental4'>,
             CustomPaletteAPI,
             RecentCombinationsAPI,
             OfflinePlayAPI {
  static type = 'elemental4';
  private static DB_VERSION = 1;

  private elementStore: ChunkedStore;
  private dbMeta: DBMeta;

  private waitNewComboEmitter = new SimpleEmitter();
  private waitNewEntryEmitter = new SimpleEmitter();

  private socket: SocketIOClient.Socket;

  private processEntry = createQueueExec(async(entry: Entry) => {
    if (entry.entry !== this.dbMeta.lastEntry + 1) {
      this.processEntry.callLater(entry);
      return;
    }
    this.dbMeta.lastEntry = entry.entry;
    if(entry.type === 'element') {
      await this.elementStore.set(entry.id, {
        id: entry.id,
        display: {
          categoryName: entry.color.base,
          color: `${entry.color.base}_${entry.color.saturation}_${entry.color.lightness}`,
          text: entry.text,
        },
        createdOn: entry.createdOn,
        stats: {
          creators: entry.creators,
          comments: [],
          fundamentals: {
            air: entry.text.toLowerCase() === 'air' ? 1 : 0,
            earth: entry.text.toLowerCase() === 'earth' ? 1 : 0,
            fire: entry.text.toLowerCase() === 'fire' ? 1 : 0,
            water: entry.text.toLowerCase() === 'water' ? 1 : 0,
          },
          recipeCount: 0,
          recipeList: [],
          usageCount: 0,
          usageList: [],
          treeComplexity: 0,
          simplestRecipe: null
        }
      } as Elem);
      // TODO get public client id
      // if (this.saveFile.get('clientPublic') === entry.creators[0]) {
      if (false) {
        // const mark = await this.ui.prompt({
        //   title: 'Suggestion Created!',
        //   text: `An Element you previously suggested was voted into the game. Since you were the first suggester, you get to add one of the two Creator Marks on this Element.\n\nPlease write your mark for "${entry.text}"`,
        //   cancelButton: null,
        //   confirmButton: 'Confirm Creator Mark',
        //   defaultText: '',
        // });
        // fetch(this.baseUrl + '/api/v1/comment/' + entry.id, {
        //   method: 'POST',
        //   body: JSON.stringify({ comment: mark }),
        //   headers: {
        //     'Authorization': `Elemental4User "${this.saveFile.get('clientSecret')}" "${this.saveFile.get('clientName')}"`,
        //     'Content-Type': 'application/json'
        //   }
        // }).then(r=>r.text()).then(() => {
        //   // ignore lolz
        // });
      }
    } else if(entry.type === 'combo') {
      if (this.dbMeta.recentCombos.length > 35) {
        this.dbMeta.recentCombos.pop();
      }
      this.dbMeta.recentCombos.unshift({
        recipe: entry.recipe.split('+') as [string, string],
        result: entry.result
      })
      await this.elementStore.set(entry.recipe, entry.result);
      await this.saveFile.set('meta', this.dbMeta);
      this.waitNewComboEmitter.emit();
      // TODO Calculate Stats LUL
    } else if(entry.type === 'comment') {
      const x = await this.elementStore.get(entry.id);
      x.stats.comments.push(entry.comment);
      await this.elementStore.set(entry.id, x);
    }
    this.waitNewEntryEmitter.emit(entry)
  });
  private async notifyUsername() {
    const id = this.saveFile.get('clientSecret');
    const name = this.saveFile.get('clientName', '[Ask on Element Suggestion]');
    if (name !== '[Ask on Element Suggestion]') {
      fetch(this.baseUrl + '/api/v1/update-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Elemental4User "${id}" "${name}"`,
        }
      });
    }
  }

  async open(ui?: ElementalLoadingUi, isOffline = false): Promise<boolean> {
    if (this.saveFile.get('clientSecret', '[unset]') === '[unset]') {
      this.saveFile.set('clientSecret', randomString(32));
      this.saveFile.set('clientName', '[Ask on Element Suggestion]');
    }

    this.elementStore = new ChunkedStore('elemental4:' + this.baseUrl);
    
    let dbFetch: string;
    try {
      this.dbMeta = await this.saveFile.get('meta');
      if(this.dbMeta.version !== Elemental4API.DB_VERSION) {
        dbFetch = 'full';
      } else if (Date.now() - this.dbMeta.lastUpdated < (1*ONE_DAY)) {
        dbFetch = 'today';
      } else if (Date.now() - this.dbMeta.lastUpdated > (30*ONE_DAY)) {
        dbFetch = 'full';
      } else {
        dbFetch = formatDate(new Date(this.dbMeta.lastUpdated));
      }
    } catch (error) {
      dbFetch = 'full';
    }

    if (!isOffline) {
      ui?.status('Updating Database');

      if(dbFetch === 'full') {
        this.elementStore.clear();
        this.dbMeta = {
          lastEntry: 0,
          lastUpdated: Date.now(),
          recentCombos: [],
          version: Elemental4API.DB_VERSION
        }
      }

      if (dbFetch !== 'none') {
        await this.elementStore.bulkTransfer(() => new Promise(async(done) => {
          const endpoint = dbFetch === 'full'
            ? '/api/v1/db/all'
            : dbFetch === 'today'
              ? '/api/v1/db/after-entry/' + this.dbMeta.lastEntry
              : '/api/v1/db/from-date/' + dbFetch
          const f = await fetch(this.baseUrl + endpoint)
          const progress = fetchWithProgress(f, true);
          
          let downloadProgress = 0;
          let processProgress = 0;
          let totalEntryCount = parseInt(f.headers.get('Elem4-Entry-Length'));
  
          console.log('Fetching ' + totalEntryCount + ' new entries.')
          
          progress.on('progress', ({ percent, current, total }) => {
            downloadProgress = percent;
            ui?.status('Updating Database', (downloadProgress + processProgress) / 2);
          });
          progress.on('done', async(text) => {
            downloadProgress = 1;
            if(text.length === 0) {
              ui?.status('Updating Database', 1);
              done();
            } else {
              ui?.status('Updating Database', (downloadProgress + processProgress) / 2);
            }
          });
  
          let finishedProcessing = 0;
          const processEntry = createQueueExec(async(x: Entry) => {
            await this.processEntry(x);
            finishedProcessing++;
            processProgress = finishedProcessing / totalEntryCount;
            ui?.status('Updating Database', (downloadProgress + processProgress) / 2);
            if (finishedProcessing === totalEntryCount) {
              done();
            }
          });
  
          let data = '';
          progress.on('data', (chunk) => {
            const split = (data + chunk).split('\n');
            data = split.pop();
            split.forEach((x) => {
              processEntry(JSON.parse(x));
            });
          });
        }))
        this.dbMeta.lastUpdated = Date.now();
      }

      await this.saveFile.set('meta', this.dbMeta);

      this.notifyUsername();

      this.socket = io(this.baseUrl);
      this.socket.on('new-entry', (entry) => {
        this.processEntry(entry);
      })
    } else {
      // you need at least the first four elements.
      if(!await this.getElement('4')) {
        await this.ui.alert({
          title: 'Database is Outdated',
          text: 'To play Elemental 4, you will need to go online to download the database.'
        });
      }
    }   
    return true;
  }
  offlineOpen(ui?: ElementalLoadingUi): Promise<boolean> {
    return this.open(ui, true);
  }
  async close(): Promise<void> {
    this.socket.close();
  }
  async getStats(): Promise<ServerStats> {
    return {
      totalElements: await this.elementStore.length()
    }
  }
  async getElement(id: string): Promise<Elem> {
    return await this.elementStore.get(id) || null;
  }
  async getCombo(ids: string[]): Promise<string[]> {
    const str = await this.elementStore.get(ids.join('+')) as string;
    return str ? [str] : [];
  }
  async getStartingInventory(): Promise<string[]> {
    return ['1','2','3','4'];
  }

  getSuggestionType() {
    return 'dynamic-elemental4' as const;
  }

  async getSuggestions(ids: string[]): Promise<Suggestion<'dynamic-elemental4'>[]> {
    const arr = await fetch(this.baseUrl + '/api/v1/suggestion/' + ids.join('+')).then(x => x.json());
    return arr;
  }
  async downvoteSuggestion(ids: string[], suggestion: SuggestionRequest<'dynamic-elemental4'>): Promise<void> {
    const r = await fetch(this.baseUrl + '/api/v1/suggestion/' + ids.join('+'), {
      method: 'POST',
      body: JSON.stringify({
        ...suggestion,
        vote: false,
      }),
      headers: {
        'Authorization': `Elemental4User "${this.saveFile.get('clientSecret')}" "${this.saveFile.get('clientName')}"`,
        'Content-Type': 'application/json'
      }
    }).then(x => x.json()) as E4SuggestionResponse;
  }
  async createSuggestion(ids: string[], suggestion: SuggestionRequest<'dynamic-elemental4'>): Promise<SuggestionResponse> {
    const clientName = this.saveFile.get('clientName');
    if (clientName === '[Ask on Element Suggestion]') {
      const name = await this.ui.prompt({
        title: 'Choose a Screen Name',
        text: 'When suggesting elements, your name can appear on them. Enter a name, or enter nothing to be anonymously credited.',
        confirmButton: 'Choose Name',
        cancelButton: null,
      });
      this.saveFile.set('clientName', name || 'Anonymous');
    }

    const r = await fetch(this.baseUrl + '/api/v1/suggestion/' + ids.join('+'), {
      method: 'POST',
      body: JSON.stringify({
        ...suggestion,
        vote: true,
      }),
      headers: {
        'Authorization': `Elemental4User "${this.saveFile.get('clientSecret')}" "${this.saveFile.get('clientName')}"`,
        'Content-Type': 'application/json'
      }
    }).then(x => x.json()) as E4SuggestionResponse;

    if (r.newElement) {
      await this.waitForElement(r.newElement);
    }

    if (r.result === 'vote-fraud-detected') {
      await this.ui.alert({
        title: 'VPN Detected',
        text: 'To avoid vote manipulation, using an IP suspected of being from a VPN service is not allowed. Your suggestion will not be considered. Please try again without using a VPN.',
      });
      return { suggestType: 'failed', };
    } else if(r.result === 'vote-fraud-detect-down') {
      await this.ui.alert({
        title: 'Server Error',
        text: 'To avoid vote manipulation, we use a service to detect users with a VPN. Unfortunately, our server cannot talk to it due to some error. Please try your vote again at a later point.',
      });
      return { suggestType: 'failed', };
    } else if (r.result === 'already-added') {
      return { suggestType: 'already-added', newElements: r.newElement ? [r.newElement] : null };
    } else if (r.result === 'suggested') {
      return { suggestType: 'suggest' };
    } else if (r.result === 'voted') {
      return { suggestType: 'vote' };
    } else if (r.result === 'element-added') {
      if(r.doCreatorMark) {
        const mark = await this.ui.prompt({
          title: 'Suggestion Created!',
          text: 'Since you cast the deciding vote, you get to add one of the two Creator Marks on this Element (The other is for the initial suggester). Leave it blank to not have one.',
          cancelButton: null,
          confirmButton: 'Confirm Creator Mark',
          defaultText: '',
        });
        fetch(this.baseUrl + '/api/v1/comment/' + r.newElement, {
          method: 'POST',
          body: JSON.stringify({ comment: mark }),
          headers: {
            'Authorization': `Elemental4User "${this.saveFile.get('clientSecret')}" "${this.saveFile.get('clientName')}"`,
            'Content-Type': 'application/json'
          }
        }).then(r=>r.text()).then(() => {
          // ignore lolz
        });
      }

      return { suggestType: 'vote', newElements: r.newElement ? [r.newElement] : null };
    }
  }

  lookupCustomPaletteColor(basePalette: Record<ElementalColorPalette, ThemedPaletteEntry>, string: string): Color {
    const [base, ...x] = string.split('_')
    const [saturation, lightness] = x.map(x => parseFloat(x));

    return applyColorTransform(basePalette[base], saturation, lightness);
  };

  getOptionsMenu(): OptionsSection[] {
    return [
      {
        title: 'Identity',
        items: [
          {
            type: 'string',
            label: 'Screen Name',
            description: 'This shows up on elements that you create.',
            saveFileProp: 'clientName',
            validator: (x) => {
              if(x.length < 3) return 'Too Short, Must be 3 characters or more.';
              if(x.length > 32) return 'Too Long, Must be 32 characters of less.'; 
              if(!x.match(/[A-Za-z0-9 !@#$%^&*(){}[]\,\.\<\>\/\\;':"=_\+-`~]/)) return 'Fancy symbols are not allowed.';
              return true;
            },
            onChange: () => {
              this.notifyUsername();
            }
          } as OptionsItem<'string'>
        ]
      }
    ]
  }

  async getRecentCombinations(limit: number) {
    return this.dbMeta.recentCombos.slice(0, limit);
  }

  waitForNewRecent() {
    return new Promise<void>((done) => {
      const f = () => (this.waitNewComboEmitter.off(f), done());
      this.waitNewComboEmitter.on(f);
    })
  }
  waitForElement(id: string) {
    return new Promise<void>((done) => {
      this.getElement(id).then(x => {
        if(!x) {
          const f = (entry: Entry) => {
            if(entry.type === 'element' && entry.id === id) {
              this.waitNewEntryEmitter.off(f);
              done();
            }
          };
          this.waitNewEntryEmitter.on(f);
        } else {
          done();
        }
      })
    })
  }
}
