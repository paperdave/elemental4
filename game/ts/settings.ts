import { escapeHTML } from "../../shared/shared";
import { setAPISaveFile, connectApi, getAPI, recalculateSavefileDropdown } from "./api";
import { animateDialogClose, animateDialogOpen, asyncConfirm, asyncPrompt, SimpleDialog } from "./dialog";
import { addElementToGame, ClearElementGameUi } from "./element-game";
import { createLoadingUi } from "./loading";
import { resetAllThemes, resetAllElements, getConfigBoolean, setConfigBoolean, getOwnedElements, getConfigString, setConfigString, processBaseUrl, getActiveSaveFile, createNewSaveFile, renameSaveFile, deleteSaveFile, setActiveSaveFile, getAPISaveFiles, uninstallServer } from "./savefile";
import { getServerList, setActiveServer } from "./server-manager";
import { getDisplayStatistics } from "./statistics";
import { decreaseThemePriority, disableTheme, enableTheme, getEnabledThemeList, getThemeList, increaseThemePriority, ThemeEntry, uninstallTheme, updateMountedCss } from "./theme";
import { addDLCByUrl } from "./dlc-fetch";
import fileSize from "filesize";
import { openDevThemeEditor } from "./theme-editor";

let themeUpdated = false;

export async function InitSettings() {
  let settingsOpen = false;

  const elemSettingsDialog = document.querySelector('#dialog-settings') as HTMLElement;

  const alwaysSuggest = getConfigBoolean('always-suggest', false);
  if (alwaysSuggest) {
    (document.querySelector('#always-suggest') as HTMLInputElement).checked = true;
  }
  const showCategoryNames = getConfigBoolean('show-category-names', false);
  if (showCategoryNames) {
    (document.querySelector('#show-category-names') as HTMLInputElement).checked = true;
    document.body.classList.add('config-show-category-names');
  }
  const elementScale = getConfigString('element-scale', 'normal');
  document.body.setAttribute('data-element-scale', elementScale);
  (document.querySelector('#element-scale') as HTMLInputElement).value = elementScale;

  const playStartupSound = getConfigBoolean('config-play-startup-sound', true);
  if (playStartupSound) {
    (document.querySelector('#play-startup-sound') as HTMLInputElement).checked = true;
    document.body.classList.add('config-play-startup-sound');
  }
  const playNotificationSound = getConfigBoolean('config-play-notification-sound', true);
  if (playNotificationSound) {
    (document.querySelector('#play-notification-sound') as HTMLInputElement).checked = true;
    document.body.classList.add('config-play-notification-sound');
  }
  const playNewsSound = getConfigBoolean('config-play-news-sound', true);
  if (playNewsSound) {
    (document.querySelector('#play-news-sound') as HTMLInputElement).checked = true;
    document.body.classList.add('config-play-news-sound');
  }

  let lastTab = '';
  async function focus(tab: string) {
    if(lastTab === 'theme' && tab !== 'theme' && themeUpdated) {
      await updateMountedCss();
      themeUpdated = false;
    }
    lastTab = tab;

    elemSettingsDialog.querySelectorAll('[data-settings]').forEach((elem) => {
      elem.classList[elem.getAttribute('data-settings') === tab ? 'add' : 'remove']('selected');
    });
    elemSettingsDialog.querySelectorAll('[data-action]').forEach((elem) => {
      elem.classList[elem.getAttribute('data-action') === tab ? 'add' : 'remove']('selected');
    });

    if (tab === 'stats') {
      const content = document.querySelector('.settings-stats');
      content.innerHTML = '';
      getDisplayStatistics().then((stats) => {
        content.innerHTML = `<h2>Statistics for Current Save File</h2><table><tbody>${stats.map(x => `<tr><td><strong>${x[0]}</strong></td><td>${x[1]}</td></tr>`).join('')}</tbody></table>`;
      });
    }
    if (tab === 'reset') {
      updateStorageEstimation();
    }
  }

  document.querySelectorAll('.settings-category,a[data-action]').forEach(elem => {
    elem.addEventListener('click', async() => {
      const action = elem.getAttribute('data-action');

      if (action === 'settings-close') {
        settingsOpen = false;
        if(themeUpdated) {
          themeUpdated = false;
          await updateMountedCss();
        }
        animateDialogClose(elemSettingsDialog);
      } else {
        focus(action);
      }
    });
  });
  document.querySelectorAll('[data-reset-button]').forEach(elem => {
    elem.addEventListener('click', async() => {
      const action = elem.getAttribute('data-reset-button');

      if(action === 'build') {
        if (await asyncConfirm('Re-download game bundle?', 'This may help fix updates. It will not modify user data.', 'Reset')) {
          localStorage.setItem('auto_start', 'true');
          localStorage.removeItem('cache');
          if (await caches.has('ELEMENTAL')) {
            caches.delete('ELEMENTAL');
          }
          location.reload();
        }
      } else if (action === 'themes') {
        if ((await asyncPrompt('Clear Downloaded Themes?', 'Type "Delete Themes" to confirm.', ''))?.toLowerCase() === 'delete themes' ) {
          await resetAllThemes();
          localStorage.removeItem('themes-enabled');
          location.reload();
        }
      } else if (action === 'all') {
        if ((await asyncPrompt('Delete Everything?', 'Clear Packs, Themes, and ALL PROGRESS on ALL SERVERS? You will be logged out, unlinking your suggestions from this account. This will not remove your created suggestions from the server. Type "Delete All Data" to confirm.', ''))?.toLowerCase() === 'delete all data' ) {
          localStorage.clear();
          localStorage.setItem('clear_idb', '1');
          location.reload();
        }
      }
    });
  });
  document.querySelector("[data-action='open-settings']").addEventListener('click', () => {
    if (!settingsOpen) {
      if (document.querySelector('.animate-panel')) {
        document.querySelector('.suggest-close').dispatchEvent(new MouseEvent('click'));
      }
      settingsOpen = true;
      animateDialogOpen(elemSettingsDialog)
      focus('general');
    }
  });
  document.querySelector("#show-category-names").addEventListener('click', (ev) => {
    const v = (ev.currentTarget as HTMLInputElement).checked;
    setConfigBoolean('show-category-names', v);
    document.body.classList[v ? 'add' : 'remove']('config-show-category-names');
  });
  document.querySelector("#always-suggest").addEventListener('click', (ev) => {
    const v = (ev.currentTarget as HTMLInputElement).checked;
    setConfigBoolean('always-suggest', v);
  });
  document.querySelector('#play-startup-sound').addEventListener('click', (ev) => {
    const v = (ev.currentTarget as HTMLInputElement).checked;
    setConfigBoolean('config-play-startup-sound', v);
  })
  document.querySelector('#play-notification-sound').addEventListener('click', (ev) => {
    const v = (ev.currentTarget as HTMLInputElement).checked;
    setConfigBoolean('config-play-notification-sound', v);
  })
  document.querySelector('#play-news-sound').addEventListener('click', (ev) => {
    const v = (ev.currentTarget as HTMLInputElement).checked;
    setConfigBoolean('config-play-news-sound', v);
  })

  document.querySelector("#element-scale").addEventListener('click', (ev) => {
    const v = (ev.currentTarget as HTMLInputElement).value;
    setConfigString('element-scale', v);
    document.body.setAttribute('data-element-scale', v);
  });

  const themes = getThemeList();
  const enabled = getEnabledThemeList().concat('elem4_default');

  const activeColumn = document.querySelector('.active-themes .theme-list')
  const availableColumn = document.querySelector('.available-themes .theme-list')

  enabled.forEach((id) => {
    const theme = themes.find(x => x.id === id);
    if (theme) {
      activeColumn.appendChild(ThemeDOM(theme));
    }
  });
  themes.forEach((theme) => {
    if (!enabled.includes(theme.id)) {
      availableColumn.appendChild(ThemeDOM(theme));
    }
  })

  document.querySelector('#theme-apply').addEventListener('click', () => {
    updateMountedCss();
    themeUpdated = false;
  });
  document.querySelector('#theme-add').addEventListener('click', async() => {
    const text = await asyncPrompt(
      'Add Theme',
      'Paste the theme URL or JSON content here.',
      '',
      'Add Theme',
      'Cancel',
      true
    );

    addDLCByUrl(text, 'theme');
  });
  document.querySelector('#server-add').addEventListener('click', async() => {
    const text = await asyncPrompt(
      'Add Server',
      'Paste the server URL here.',
      '',
      'Add Server',
      'Cancel',
      true
    );

    await addDLCByUrl(text, 'server');
  });
  document.querySelector('#theme-browse').addEventListener('click', () => {
    window.open('/workshop#themes', '', 'width=800,height=600', true);
  });
  document.querySelector('#theme-devmode').addEventListener('click', () => {
    openDevThemeEditor();
  });
  document.querySelector('#server-remove').addEventListener('click', async() => {
    const conf = getAPI().config;
    if(await asyncConfirm('Remove Server', `Remove ${conf.name || `Untitled Server (type=${conf.type})`}? This will remove all downloaded server data, and your local save files.`)) {
      await uninstallServer(getAPI().baseUrl);
    }
  });

  const serverSelect = document.querySelector('#change-server') as HTMLSelectElement;
  const servers = await getServerList();
  servers.forEach((server) => {
    const option = document.createElement('option');
    option.value = server.baseUrl;
    option.innerHTML = escapeHTML(`${server.name} - ${processBaseUrl(server.baseUrl)}`);
    serverSelect.appendChild(option);
  });
  serverSelect.value = 'internal:change-btn';
  serverSelect.addEventListener('change', async() => {
    const value = serverSelect.value;
    const server = servers.find(x => x.baseUrl === value);
    if (server) {
      const ui = createLoadingUi();
      ui.status('Connecting to ' + processBaseUrl(server.baseUrl), 0)
      ui.show();
      setActiveServer(server.baseUrl);
      document.querySelector('.suggest-close').dispatchEvent(new MouseEvent('click'));
      try {
        await connectApi(server.baseUrl, null, ui);
      } catch (error) {
        const line1 = document.createElement('p');
        line1.innerHTML = `Could not connect to <code>${escapeHTML(server.baseUrl)}</code>.`
        const line2 = document.createElement('pre');
        line2.innerHTML = `<code>${error.stack}</code>`

        SimpleDialog({
          title: 'Server Connection Error',
          content: [
            line1,
            line2
          ]
        })
      }
      ui.dispose();
    }
    serverSelect.value = 'internal:change-btn';
  })

  const saveSelect = document.querySelector('#change-savefile') as HTMLSelectElement
  saveSelect.addEventListener('change', async() => {
    const value = saveSelect.value;
    if(value.startsWith('save:')) {
      setAPISaveFile(value.slice(5));
    }
  })
  const saveModifySelect = document.querySelector('#modify-savefile') as HTMLSelectElement
  saveModifySelect.addEventListener('change', async() => {
    const value = saveModifySelect.value;
    const api = getAPI();
    if(value === 'create') {
      const name = await asyncPrompt('Create Save File', 'Enter the savefile name', `Save #${saveSelect.options.length + 1}`, 'Create');
      if(name) {
        await createNewSaveFile(api, name);
        recalculateSavefileDropdown();
      }
    } else if(value === 'rename') {
      const name = await asyncPrompt('Rename Save File', 'Enter the savefile name', `${saveSelect.options[saveSelect.selectedIndex].text}`, 'Rename');
      if(name) {
        await renameSaveFile(api, await getActiveSaveFile(api), name);
        recalculateSavefileDropdown();
      }
    } else if(value === 'delete') {
      const confirm = await asyncConfirm('Delete Save File', 'Are you sure you want to delete this save file?', 'Delete', 'Keep');
      if(confirm) {
        await deleteSaveFile(api, await getActiveSaveFile(api));
        setActiveSaveFile(api, (await getAPISaveFiles(api))[0].id);
        recalculateSavefileDropdown();
      }
    }
    saveModifySelect.value = 'title'
  });

  await updateStorageEstimation();
}

interface StorageEstimate {
  quota: number;
  usage: number;
  usageDetails?: {
    indexedDB: number;
    caches: number;
    serviceWorkerRegistrations: number;
  }
}

export async function updateStorageEstimation() {
  try {
    const { quota, usage, usageDetails } = await navigator.storage.estimate() as StorageEstimate
    document.getElementById('storage-no-anything').style.display = 'none';
    document.querySelector('#storage-quota-used').innerHTML = escapeHTML(fileSize(usage));
    document.querySelector('#storage-quota-total').innerHTML = escapeHTML(fileSize(quota));
    if(usageDetails) {
      const caches = usageDetails.caches || 0;
      const indexedDB = usageDetails.indexedDB || 0;
      const workers = usageDetails.serviceWorkerRegistrations || 0;
      const totalBreakdown = caches+indexedDB+workers;
      document.getElementById('storage-bar').innerHTML = [
        caches > 0 && `<div style='flex:1 1 ${100*(caches/totalBreakdown)}%' class='storage-caches'></div>`,
        indexedDB > 0 && `<div style='flex:1 1 ${100*(indexedDB/totalBreakdown)}%' class='storage-indexedDB'></div>`,
        workers > 0 && `<div style='flex:1 1 ${100*(workers/totalBreakdown)}%' class='storage-workers'></div>`,
      ].filter(Boolean).join('');
      document.getElementById('storage-breakdown').innerHTML = [
        caches > 0 && `<tr><td style='width:max-content'><strong>${fileSize(caches)}</strong></td><td style='display:flex;align-items:center;justify-content:center'><span class='inline-storage-icon storage-caches'></span></td><td>Game and Theme Caches</td></tr>`,
        indexedDB > 0 && `<tr><td style='width:max-content'><strong>${fileSize(indexedDB)}</strong></td><td style='display:flex;align-items:center;justify-content:center'><span class='inline-storage-icon storage-indexedDB'></span></td><td>Element and Config Databases</td></tr>`,
        workers > 0 && `<tr><td style='width:max-content'><strong>${fileSize(workers)}</strong></td><td style='display:flex;align-items:center;justify-content:center'><span class='inline-storage-icon storage-workers'></span></td><td>Service Worker</td></tr>`,
      ].filter(Boolean).join('');
      document.getElementById('storage-no-breakdown').style.display = 'none';
    } else {
      document.getElementById('storage-yes-breakdown').style.display = 'none';
    }
  } catch (error) {
    document.getElementById('storage-yes-breakdown').style.display = 'none';
    document.getElementById('storage-no-breakdown').style.display = 'none';
  }
}

function ThemeDOM(theme: ThemeEntry) {
  const dom = document.createElement('div');
  dom.setAttribute('data-theme-item', theme.id)
  dom.classList.add('theme-item');
  const moveButtons = document.createElement('div');
  moveButtons.classList.add('theme-move-buttons');
  if (theme.icon) {
    moveButtons.setAttribute('style', `background-image:url(${theme.icon});background-size:cover;`)
  }
  dom.appendChild(moveButtons);

  const info = document.createElement('div');
  info.classList.add('theme-info');

  const themeTitle = document.createElement('div')
  const themeDescription = document.createElement('div')
  themeTitle.classList.add('theme-title');
  themeDescription.classList.add('theme-description');
  themeTitle.innerHTML = escapeHTML(theme.name);
  themeDescription.innerHTML = escapeHTML(theme.description);
  info.appendChild(themeTitle);
  info.appendChild(themeDescription);

  if(theme.id !== 'elem4_default') {
    moveButtons.innerHTML = `
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="60" fill="black" fill-opacity="0.4"/>
        <path class="svg-btn btn-when-activated btn-down" d="M32 32H55L43.5 49L32 32Z" fill="white"/>
        <path class="svg-btn btn-when-activated btn-up" d="M55 28L32 28L43.5 11L55 28Z" fill="white"/>
        <path class="svg-btn btn-when-activated btn-deactivate" d="M28 11V49L5 30L28 11Z" fill="white"/>
        <path class="svg-btn btn-when-deactivated btn-activate" d="M30 49L30 11L53 30L30 49Z" fill="white"/>
        ${theme.isBuiltIn ? '' : `<path class="svg-btn btn-when-deactivated btn-trash" d="M22 32H18.5L17.5 31H12.5L11.5 32H8V34H22V32ZM9 47C9 47.5304 9.21071 48.0391 9.58579 48.4142C9.96086 48.7893 10.4696 49 11 49H19C19.5304 49 20.0391 48.7893 20.4142 48.4142C20.7893 48.0391 21 47.5304 21 47V35H9V47Z" fill="white"/>`}
      </svg>
    `;

    const btnActivate = moveButtons.querySelector('.btn-activate');
    const btnDeactivate = moveButtons.querySelector('.btn-deactivate');
    const btnUp = moveButtons.querySelector('.btn-up');
    const btnDown = moveButtons.querySelector('.btn-down');
    const btnTrash = moveButtons.querySelector('.btn-trash');

    btnActivate.addEventListener('click', () => {
      const activeColumn = document.querySelector('.active-themes .theme-list')
      activeColumn.prepend(dom);
      enableTheme(theme.id);
      themeUpdated = true;
    });
    btnDeactivate && btnDeactivate.addEventListener('click', () => {
      const availableColumn = document.querySelector('.available-themes .theme-list')
      availableColumn.prepend(dom);
      disableTheme(theme.id);
      themeUpdated = true;
    });
    btnUp.addEventListener('click', () => {
      decreaseThemePriority(theme.id);
      dom.parentElement.insertBefore(dom, dom.previousElementSibling);
      themeUpdated = true;
    });
    btnDown.addEventListener('click', () => {
      increaseThemePriority(theme.id);
      dom.parentElement.insertBefore(dom, dom.nextElementSibling.nextElementSibling);
      themeUpdated = true;
    });
    btnTrash && btnTrash.addEventListener('click', () => {
      dom.remove();
      disableTheme(theme.id);
      uninstallTheme(theme.id);
      themeUpdated = true;
    });
  }

  dom.appendChild(info);

  return dom
}

export function addThemeToUI(theme: any) {
  if (theme && theme.type === 'elemental4:theme') {
    const find = document.querySelector('[data-theme-item="' + theme.id + '"]');
    if(find) {
      const dom = ThemeDOM(theme);
      find.parentElement.insertBefore(dom, find);
      find.remove();
    } else {
      const activeColumn = document.querySelector('.active-themes .theme-list')
      activeColumn.prepend(ThemeDOM(theme));
    }
  }
}
