import { CustomPaletteAPI, Elem, ElementalBaseAPI, ElementalColorPalette, ElementalLoadingUi, ServerStats, Suggestion, SuggestionAPI, SuggestionRequest, SuggestionResponse, applyColorTransform, ThemedPaletteEntry, OptionsSection, OptionsItem, RecentCombinationsAPI, RecentCombination, OptionsMenuAPI, SuggestionColorInformation } from "../elem";
import { E4SuggestionResponse, Entry } from '../elemental4-types';
import { fetchWithProgress } from '../fetch-progress';
import { delay, randomString, sortCombo } from '../shared';
import Color from 'color';
import { SimpleEmitter } from '@reverse/emitter';
import io from 'socket.io-client';
import { createQueueExec } from '../async-queue-exec';

const ONE_DAY = 24*60*60*1000;

function formatDate(x: Date) {
  return `${x.getUTCFullYear()}-${(x.getUTCMonth()+1).toString().padStart(2,'0')}-${x.getUTCDate().toString().padStart(2, '0')}`;
}

interface DBMeta {
  lastEntry: number;
  lastUpdated: number;
  recentCombos: RecentCombination[];
  version: number;
  dbId: string;
}

export class Elemental4API
  extends ElementalBaseAPI
  implements CustomPaletteAPI,
             SuggestionAPI<'dynamic-elemental4'>,
             OptionsMenuAPI,
             RecentCombinationsAPI  {
  static type = 'elemental4';
  private static DB_VERSION = 7;

  private dbMeta: DBMeta;

  private waitNewComboEmitter = new SimpleEmitter();
  private waitNewEntryEmitter = new SimpleEmitter();

  private socket: SocketIOClient.Socket;

  private async calculateFundamentals(eLeftI: string | Elem, eRightI: string | Elem, eResultI: string | Elem) {
    const eLeft = typeof eLeftI === 'string' ? await this.getElement(eLeftI) : eLeftI;
    const eRight = typeof eRightI === 'string' ? await this.getElement(eRightI) : eRightI;
    const eResult = typeof eResultI === 'string' ? await this.getElement(eResultI) : eResultI;
    
    const complexity = Math.max(eLeft.stats.treeComplexity, eRight.stats.treeComplexity) + 1;
    if ((complexity < eResult.stats.treeComplexity || (eResult.stats.treeComplexity === 0 && eResult.stats.usageCount === 0))) {
      eResult.stats.treeComplexity = complexity;
      eResult.stats.simplestRecipe = sortCombo(eLeft.id, eRight.id);
      eResult.stats.fundamentals = {
        air: eLeft.stats.fundamentals.air + eRight.stats.fundamentals.air,
        fire: eLeft.stats.fundamentals.fire + eRight.stats.fundamentals.fire,
        water: eLeft.stats.fundamentals.water + eRight.stats.fundamentals.water,
        earth: eLeft.stats.fundamentals.earth + eRight.stats.fundamentals.earth,
      };
      const list = eResult.stats.usageList;
      
      await this.store.set(eResult.id, eResult);
      
      for (let i = 0; i < list.length; i++) {
        const recipe = list[i];
        await this.calculateFundamentals(recipe.recipe[0], recipe.recipe[1], recipe.result[0]);
      }
    }
  }
  private processEntry = createQueueExec(async(entry: Entry) => {
    if (entry.entry <= this.dbMeta.lastEntry) {
      console.log('[E4API] Skipping Entry ' + entry.entry + '; ' + entry.type)
      return;
    }
    if (entry.entry !== this.dbMeta.lastEntry + 1) {
      console.log('[E4API] Entry out of order. expected #' + (this.dbMeta.lastEntry + 1) + ' but got #' + entry.entry + '. calling later');
      this.processEntry.callLater(entry);
      return;
    }
    if(entry.type === 'element') {
      await this.store.set(entry.id, {
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
      if (entry.creators.includes(this.saveFile.get('clientPublic'))) {
        console.log('Request Comment', entry);
      // if (false) {
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
        //     'Authorization': `Elemental4User "${this.saveFile.get('clientSecret')}" "${encodeURIComponent(this.saveFile.get('clientName'))}"`,
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

      const recipe = entry.recipe.split('+') as [string, string];
      
      this.dbMeta.recentCombos.unshift({
        recipe: recipe,
        result: entry.result
      })
      await this.store.set(entry.recipe, entry.result);
      this.waitNewComboEmitter.emit();
      
      const eResult = await this.getElement(entry.result);
      eResult.stats.recipeCount++;
      eResult.stats.recipeList.push(recipe);

      const eLeft = await this.getElement(recipe[0]);
      
      eLeft.stats.usageCount++;
      eLeft.stats.usageList.push({ recipe, result: [entry.result] });

      let eRight = eLeft;
      if (recipe[0] !== recipe[1]) {
        eRight = await this.getElement(recipe[1]);
        eRight.stats.usageCount++;
        eRight.stats.usageList.push({ recipe, result: [entry.result] });
        await this.store.set(eRight.id, eRight);
      }

      await this.store.set(eLeft.id, eLeft);
      await this.store.set(eResult.id, eResult);

      await this.calculateFundamentals(eLeft, eRight, eResult);
    } else if(entry.type === 'comment') {
      const x = await this.store.get(entry.id);
      x.stats.comments.push({ author: entry.user, comment: entry.comment });
      await this.store.set(entry.id, x);
    }
    this.dbMeta.lastEntry = entry.entry;
    this.saveFile.set('meta', this.dbMeta);
    this.waitNewEntryEmitter.emit(entry);
  });
  private async notifyUsername() {
    const id = this.saveFile.get('clientSecret');
    const name = this.saveFile.get('clientName', '[Ask on Element Suggestion]');
    if (name !== '[Ask on Element Suggestion]') {
      const obj = await fetch(this.baseUrl + '/api/v1/update-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Elemental4User "${id}" "${encodeURIComponent(name)}"`,
        }
      }).then(x => x.json());
      if(obj && obj.publicId && obj.publicId !== 'null-user') {
        this.saveFile.set('clientPublic', obj.publicId);
      }
    }
  }

  async open(ui?: ElementalLoadingUi, errorRecovery: boolean = false): Promise<boolean> {
    (window as any).repair = this.ui.loading.bind(this.ui, this.resetDatabase.bind(this));

    if (this.saveFile.get('clientSecret', '[unset]') === '[unset]') {
      this.saveFile.set('clientSecret', randomString(32));
      this.saveFile.set('clientName', '[Ask on Element Suggestion]');
    }

    let dbFetch: string;
    try {
      this.dbMeta = await this.saveFile.get('meta');
      if(errorRecovery || this.dbMeta.version !== Elemental4API.DB_VERSION || this.dbMeta.dbId !== this.config.dbId) {
        dbFetch = 'full';
      } else if (formatDate(new Date()) === formatDate(new Date(this.dbMeta.lastUpdated))) {
        dbFetch = 'today';
      } else if (Date.now() - this.dbMeta.lastUpdated > (30*ONE_DAY)) {
        dbFetch = 'full';
      } else {
        dbFetch = formatDate(new Date(this.dbMeta.lastUpdated));
      }
    } catch (error) {
      dbFetch = 'full';
    }

    this.running = true;

    try {
      ui?.status('Updating Database');

      if(dbFetch === 'full') {
        await this.store.clear();
        this.dbMeta = {
          lastEntry: 0,
          lastUpdated: Date.now(),
          recentCombos: [],
          version: Elemental4API.DB_VERSION,
          dbId: this.config.dbId,
        }
      }

      if (dbFetch !== 'none') {
        console.log(`[E4API] Fetch "${dbFetch}", have #${this.dbMeta.lastEntry} at ${this.dbMeta.lastUpdated}.`)
        await this.store.bulkTransfer(() => new Promise(async(done, err) => {
          try {
            const endpoint = dbFetch === 'full'
              ? '/api/v1/db/all'
              : dbFetch === 'today'
                ? '/api/v1/db/after-entry/' + (this.dbMeta.lastEntry - 1)
                : '/api/v1/db/from-date/' + dbFetch
            const f = await fetch(this.baseUrl + endpoint)
            const progress = fetchWithProgress(f, true);
            
            let downloadProgress = 0;
            let processProgress = 0;
            let totalEntryCount = parseInt(f.headers.get('Elem4-Entry-Length'));
    
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
            let stop = false;
            const queue = createQueueExec((entry: any) => {
              if(stop)return;
              return processEntry(entry)
            })
            progress.on('data', (chunk) => {
              if(stop)return;
              const split = (data + chunk).split('\n');
              data = split.pop();
              split.forEach((x) => {
                let json;
                try {
                  json = JSON.parse(x);
                } catch (error) {
                  err(error);
                }
                queue(json).catch((e) => {
                  stop = true;
                  err(e)
                });
              });
            });
          } catch (error) {
            err(error)
          }
        })).catch(() => {})
        this.dbMeta.lastUpdated = Date.now();
      }

      await this.saveFile.set('meta', this.dbMeta);

      await this.notifyUsername();

      this.socket = io(this.baseUrl);
      this.socket.on('disconnect', () => {
        console.log('[E4API] Disconnected');
        this.onAPIDisconnect();
      });
      this.socket.on('new-entry', (entry) => {
        this.processEntry(entry);
      });
    } catch(e) {
      // you need at least the first four elements.
      if(!await this.getElement('4')) {
        await this.ui.alert({
          title: 'Database is Outdated',
          text: 'To play Elemental 4, you will need to go online to download the database.'
        });
      }
      this.onAPIDisconnect();
    }

    return true;
  }
  async close(): Promise<void> {
    this.running = false;
    this.socket.close();
    delete (window as any).repair;
  }
  async getStats(): Promise<ServerStats> {
    return {
      totalElements: await this.store.length()
    }
  }
  async getElement(id: string): Promise<Elem> {
    return await this.store.get(id) || null;
  }
  async getCombo(ids: string[]): Promise<string[]> {
    const str = await this.store.get(ids.join('+')) as string;
    return str ? [str] : [];
  }
  async getStartingInventory(): Promise<string[]> {
    return ['1','2','3','4'];
  }

  private running = false;
  async onAPIDisconnect() {
    while (this.running) {
      try {
        const response = await fetch(this.baseUrl + '/');
        if (response.ok) {
          this.ui.reloadSelf();
          return;
        }
      } catch (error) {

      }
      await delay(8000);
    }
  }

  getSuggestionColorInformation(): SuggestionColorInformation<'dynamic-elemental4'> {
    return {
      type: 'dynamic-elemental4'
    };
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
        'Authorization': `Elemental4User "${this.saveFile.get('clientSecret')}" "${encodeURIComponent(this.saveFile.get('clientName'))}"`,
        'Content-Type': 'application/json'
      }
    }).then(x => x.json()) as E4SuggestionResponse;
  }
  async createSuggestion(ids: string[], suggestion: SuggestionRequest<'dynamic-elemental4'>): Promise<SuggestionResponse> {
    const clientName = this.saveFile.get('clientName');
    if (clientName === '[Ask on Element Suggestion]') {
      const name = await this.ui.prompt({
        title: 'Choose a Screen Name',
        text: 'When suggesting elements, your name can appear on them. Enter a name, or enter nothing to be anonymously credited. This can be changed at any time in Settings -> Server.',
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
        'Authorization': `Elemental4User "${this.saveFile.get('clientSecret')}" "${encodeURIComponent(this.saveFile.get('clientName'))}"`,
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
          defaultInput: '',
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
    } else if (r.result === 'internal-error') {
      await this.ui.alert({
        title: 'Server Error',
        text: 'An error occured during loading',
      });

      return { suggestType: 'failed'  };
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
        desc: 'Settings related to your suggestions and logged in user. Logins are based on secret tokens associated with usernames.',
        items: [
          {
            type: 'string',
            label: 'Screen Name',
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
          } as OptionsItem<'string'>,
          {
            type: 'button',
            label: 'Export Login',
            onChange: async() => {
              if(
                await this.ui.confirm({
                  title: 'Export Login',
                  text: 'The following information is very sensitive, and links your username to your created elements. It does not contain your owned elements. Do not share it with others.'
                })
              ) {
                this.ui.alert({
                  title: 'Export Login',
                  text: `Your login does not work on a username and password, but a secret token, yours is:\n**\`\n${this.saveFile.get('clientSecret')}\n\`**`
                })
              }
            },
          },
          {
            type: 'button',
            label: 'Import Login',
            onChange: async() => {
              const { secret } = await this.ui.dialog({
                title: 'Import Login',
                parts: [
                  'By importing your login you will be logged out of your current profile.',
                  {
                    id: 'secret',
                    type: 'password',
                  }
                ]
              });
              if (secret) {
                const obj = await fetch(this.baseUrl + '/api/v1/update-profile', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Elemental4User "${secret}" "${encodeURIComponent("Test")}"`,
                  }
                }).then(x => x.json());
                if (obj.exists) {
                  this.saveFile.set('clientName', obj.display);
                  this.saveFile.set('clientSecret', secret);
                  this.saveFile.set('clientPublic', obj.public_id);
                } else {
                  if(await this.ui.confirm({
                    title: 'No Elements',
                    text: 'This account does not have any suggestions or elements sent. Continue with login?'
                  })) {
                    this.saveFile.set('clientSecret', secret);
                    this.saveFile.set('clientPublic', null);
                  }
                }
              }
            },
          }
        ]
      },
      {
        title: 'Database',
        items: [
          {
            label: 'Reset Local Database',
            type: 'button',
            onChange: () => {
              this.ui.loading(this.resetDatabase.bind(this));
            }
          }
        ]
      }
    ]
  }

  async resetDatabase(ui: ElementalLoadingUi) {
    ui.status('Resetting Database');
    this.dbMeta.version = -100;
    await this.saveFile.set('meta', this.dbMeta);
    await this.ui.reloadSelf();
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
