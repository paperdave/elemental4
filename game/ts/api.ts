import { Elemental4API } from "../../shared/api/elemental4";
import { Elemental5API } from "../../shared/api/elemental5";
import { NV7ElementalAPI } from "../../shared/api/nv7/nv7";
import { ElementalBaseAPI, ElementalConfig, ElementalLoadingUi, ElementalSubAPIs, getSubAPI, ServerSavefileEntry } from "../../shared/elem";
import { delay, delayFrame, escapeHTML } from "../../shared/shared";
import { SingleplayerAPI } from "./api-singleplayer";
import { AlertDialog, ConfirmDialog, PromptDialog, CustomDialog } from "./dialog";
import { ClearElementGameUi} from "./element-game";
import { addElementToGame } from "./add-element";
import { InitElementNews } from "./element-game/recents";
import { createLoadingUi } from "./loading";
import { canCreateSaveFile, canDeleteSaveFile, canRenameSaveFile, getActiveSaveFile, getAPISaveFile, getAPISaveFiles, getOwnedElements, getServer, installServer, processBaseUrl, setActiveSaveFile } from "./savefile";
import { endStatistics, startStatistics } from "./statistics";
import { RebornElementalAPI } from "../../shared/api/reborn";
import { allBuiltInServers } from "./server-manager";
import { ChunkedStore } from "../../shared/store-chunk";
import { LedomElementalAPI } from "../../shared/api/ledom";
import { resolve } from "url";
import { InternalNullAPI, IsNullAPI } from "../../shared/api/internal/internal-null";
import { InternalStressTestAPI } from "../../shared/api/internal/internal-stress-test";
import { DebugAllColorsAPI } from "../../shared/api/internal/internal-all-colors";

// @ts-ignore
class IHateTypescript extends ElementalBaseAPI {
  baseUrl = '';
}

const apiTypeMap: Record<string, typeof IHateTypescript> = {
  'internal:null': InternalNullAPI,
  'internal:all-colors': DebugAllColorsAPI,
  'internal:stress-test': InternalStressTestAPI,
  'internal:singleplayer': SingleplayerAPI,
  'reborn': RebornElementalAPI,
  'elemental4': Elemental4API,
  'elemental5': Elemental5API,
  'e4': LedomElementalAPI,
  'ledom': LedomElementalAPI,
  'nv7': NV7ElementalAPI,
};

let currentAPI: ElementalBaseAPI;
let currentSaveFile: string;
let currentSaveFileList: ServerSavefileEntry[];

export const builtInApis = {
  'internal:null': {
    type: "internal:null",
    name: "No Server",
    description: "You are not connected to any server.",
    icon: location.origin + '/null-server.png',
  },
  'internal:singleplayer': {
    type: "internal:singleplayer",
    name: "Singleplayer with Element Packs",
    description: "Create Element Packs to create your own Elemental Game, or play back shut down databases.",
    icon: location.origin + '/singleplayer.png',
  },
  'internal:all-colors': {
    type: "internal:all-colors",
    name: "Theme Debug: All Colors",
    description: "Contains all colors from the Elemental Palette.",
    icon: location.origin + '/all-colors-server.png',
  },
  'internal:stress-test-1k': {
    type: "internal:stress-test",
    name: "Stress Test: 5k Elements, 1 Category",
    description: "1k Dummy Elements",
    elements: 1000
  },
  'internal:stress-test-5k': {
    type: "internal:stress-test",
    name: "Stress Test: 5k Elements, 1 Category",
    description: "5k Dummy Elements",
    elements: 5000
  },
  'internal:stress-test-10k': {
    type: "internal:stress-test",
    name: "Stress Test: 10k Elements, 1 Category",
    description: "10k Dummy Elements",
    elements: 10000
  },
}

export async function getSupportedServerTypes() {
  return Object.keys(apiTypeMap);
}

export async function connectApi(baseUrl: string, config: ElementalConfig, ui?: ElementalLoadingUi) {
  baseUrl = baseUrl.replace(/\/(elemental\.json)?$/, '');
  
  let selfMadeUi = false;
  if(!ui) {
    ui = createLoadingUi();
    selfMadeUi = true;
  }
  await endStatistics()
  try {
    const json = config || builtInApis[baseUrl] || (await fetch(baseUrl + '/elemental.json').then(x => x.json()));
    installServer(baseUrl, json);

    const API = apiTypeMap[json.type];

    const api = new API({
      baseUrl,
      config: json,
      saveFile: await getAPISaveFile(baseUrl),
      ui: {
        alert: AlertDialog,
        confirm: ConfirmDialog,
        prompt: PromptDialog,
        dialog: CustomDialog,
        popup: (o) => Promise.resolve(null),
      },
      store: json.type.startsWith('internal:')
        ? new ChunkedStore('data.' + json.type.slice(9))
        : new ChunkedStore(json.type + ':' + processBaseUrl(baseUrl))
    });
    let isOpen = await api.open(ui);
    if (!isOpen) {
      throw new Error("Could not open API connection.");
    }
    if (currentAPI) {
      try {
        currentAPI.close();
      } catch (error) {
        console.error('Could not close the current API. This will probably cause a memory leak.');
        console.error(error);
      }
    }

    currentAPI = api;
    ClearElementGameUi();

    (document.querySelector('#element-sidebar') as HTMLElement).style.display = getSubAPI(api, 'suggestion') ? 'block' : 'none';
    (document.querySelector('#null_server') as HTMLElement).style.display = api[IsNullAPI] ? 'flex' : 'none';
    document.querySelector('#server-name').innerHTML = api[IsNullAPI] ? '' : '<b>Server:</b> ' + escapeHTML(`${json.name || `Untitled Server (type=${json.type})`}${baseUrl.startsWith('internal:') ? '' : ` — ${baseUrl}`}`);
    document.querySelector('#server-title').innerHTML = escapeHTML(json.name || `Unnamed Server (type=${json.type})`);
    document.querySelector('#server-description').innerHTML = escapeHTML(json.description || `[No description provided]`);
    if (json.icon) {
      document.querySelector('#server-icon').setAttribute('style', `background-image:url(${resolve(baseUrl, json.icon)});background-size:cover;`)
    } else {
      document.querySelector('#server-icon').setAttribute('style', `background-color:#888;`)
    }

    if (allBuiltInServers.includes(baseUrl)) {
      document.querySelector('#server-remove').setAttribute('disabled', 'true');
    } else {
      document.querySelector('#server-remove').removeAttribute('disabled');
    }

    ui.status('Loading News');
    await InitElementNews();

    await onSaveFileLoad(ui);

    ui.status('Starting Statistics');

    await startStatistics();

    if(selfMadeUi) {
      (ui as any).dispose();
    }

    return true;
  } catch (error) {
    console.error(error);
    if(selfMadeUi) {
      (ui as any).dispose();
    }
    
    if(currentAPI)startStatistics();

    throw error; 
  }
}

export async function setAPISaveFile(id: string) {
  const ui = createLoadingUi();
  try {
    if(id !== currentSaveFile) {
      ui.status('Saving Current Game', 0);
      await endStatistics()
      ClearElementGameUi();
      ui.status('Loading Savefile', 0);
      await setActiveSaveFile(currentAPI, id);
      await onSaveFileLoad(ui);
      ui.status('Finalizing', 0);
      await startStatistics();
    }
  } catch (error) {
    
  }
  ui.dispose();
}

async function onSaveFileLoad(ui: ElementalLoadingUi) {
  ui.status('Loading Elements');
  const ownedElements = await getOwnedElements(currentAPI);
  const elementsToAdd = await Promise.all(ownedElements.map(id => currentAPI.getElement(id)));
  elementsToAdd.forEach((elem, i, a) => {
    
  });

  for (let i = 0; i < elementsToAdd.length; i++) {
    if (i % 500 === 0) {
      ui.status('Loading Elements', i / elementsToAdd.length)
      await delay(1);
    }
    addElementToGame(elementsToAdd[i])
  }

  ui.status('Loading Elements', 1);

  // try and wait if a ton of elements exist
  await delayFrame();
  await delayFrame();

  await recalculateSavefileDropdown();
}

export async function recalculateSavefileDropdown() {
  currentSaveFileList = await getAPISaveFiles(currentAPI);
  currentSaveFile = await getActiveSaveFile(currentAPI);

  const changeSaveFile = document.getElementById('change-savefile') as HTMLSelectElement;
  changeSaveFile.innerHTML = currentSaveFileList.map(x => `<option value="save:${escapeHTML(x.id)}">${escapeHTML(x.name)}</option>`).join('')
  changeSaveFile.value = 'save:' + currentSaveFile;
  
  (document.getElementById('modify-savefile-create') as HTMLOptionElement).disabled = !canCreateSaveFile(currentAPI, '');
  (document.getElementById('modify-savefile-rename') as HTMLOptionElement).disabled = !canRenameSaveFile(currentAPI, await getActiveSaveFile(currentAPI), '');
  (document.getElementById('modify-savefile-delete') as HTMLOptionElement).disabled = !canDeleteSaveFile(currentAPI, await getActiveSaveFile(currentAPI));
}

export function getAPI(): ElementalBaseAPI
export function getAPI<SubAPIName extends keyof ElementalSubAPIs>(type?: SubAPIName): null | (ElementalBaseAPI & ElementalSubAPIs[SubAPIName])
export function getAPI(type?: any) {
  return getSubAPI(currentAPI, type) as any;
}
