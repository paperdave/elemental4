import { escapeHTML } from "../../../shared/shared";
import { animateDialogClose, animateDialogOpen } from "../dialog";
import { getDisplayStatistics } from "../statistics";
import { updateMountedCss } from "../theme";
import fileSize from "filesize";
import { playSound } from "../audio";
import { themeUpdated, setThemeUpdated, themeSettings } from "./theme";
import { storageSettings } from "./storage";
import { serverSettings } from "./servers";
import { generalSettings } from "./general";
import { audioSettings } from "./audio";

export async function InitSettings() {
  let settingsOpen = false;

  const elemSettingsDialog = document.querySelector('#dialog-settings') as HTMLElement;

  let lastTab = '';
  async function focus(tab: string) {
    if(lastTab === 'theme' && tab !== 'theme' && themeUpdated) {
      await updateMountedCss();
      setThemeUpdated(false);
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
          setThemeUpdated(false);
          await updateMountedCss();
        }
        animateDialogClose(elemSettingsDialog);
      } else {
        playSound('dialog.button')
        focus(action);
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

  document.querySelector("#open-server-settings").addEventListener('click', () => {
    if (!settingsOpen) {
      if (document.querySelector('.animate-panel')) {
        document.querySelector('.suggest-close').dispatchEvent(new MouseEvent('click'));
      }
      settingsOpen = true;
      animateDialogOpen(elemSettingsDialog)
      focus('server');
    }
  });
  

  generalSettings();
  storageSettings();
  serverSettings();
  themeSettings();
  audioSettings();

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
