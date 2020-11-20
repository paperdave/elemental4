import { ConfirmDialog, PromptDialog } from "../dialog";
import { resetAllThemes } from "../savefile";
import browserInfo from "../browser-info";
import JSZip from "jszip";
import { formatDate } from "../../../shared/shared";

declare const $build_date: string;
declare const $production: string;

export function storageSettings() {
  document.querySelectorAll('[data-reset-button]').forEach(elem => {
    elem.addEventListener('click', async() => {
      const action = elem.getAttribute('data-reset-button');

      if(action === 'build') {
        if (await ConfirmDialog({
          title: 'Re-download game bundle?',
          text: 'This may help fix updates. It will not modify user data.',
          trueButton: 'Reset'
        })) {
          localStorage.setItem('auto_start', 'true');
          localStorage.removeItem('cache');
          if (await caches.has('ELEMENTAL')) {
            caches.delete('ELEMENTAL');
          }
          location.reload();
        }
      } else if (action === 'themes') {
        if ((await PromptDialog({
          title: 'Clear Downloaded Themes?',
          text: 'Type "Delete Themes" to confirm.'
        }))?.toLowerCase() === 'delete themes' ) {
          await resetAllThemes();
          localStorage.removeItem('themes-enabled');
          location.reload();
        }
      } else if (action === 'all') {
        if ((await PromptDialog({
          title: 'Delete Everything?',
          text: 'Clear Packs, Themes, and ALL PROGRESS on ALL SERVERS? You will be logged out, unlinking your suggestions from this account. This will not remove your created suggestions from the server. Type "Delete All Data" to confirm.'
        }))?.toLowerCase() === 'delete all data' ) {
          localStorage.clear();
          localStorage.setItem('clear_idb', '1');
          location.reload();
        }
      }
    });
  });

  document.querySelector('#dump-everything').addEventListener('click', async() => {
    var zip = new JSZip();
    zip.file("readme.txt", [
      `This is a data dump for Elemental 4`,
      ``,
      `Elemental v${require('../../../package.json').version}${$production ? '' : ' (Local Build)'}`,
      `Built on ${$build_date}`,
      `${browserInfo.browserName} ${browserInfo.fullVersion} on ${browserInfo.osName}`,
      `Exported on ${formatDate(new Date())}`
    ].join('\n'));

    await new Promise(resolve => {
      const request = indexedDB.open("ELEMENTAL");
      request.onsuccess = function() {
        exportToJson(this.result, (_, result) => {
          Object.keys(result).forEach(name => {
            if(name !== 'local-forage-detect-blob-support') {
              zip.file(name + '.json', JSON.stringify(result[name], null, 2))
            }
          });
          resolve()
        });
      };
    });

    const local = {};
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      local[key] = localStorage.getItem(key);
    }
    zip.file('local_storage.json', JSON.stringify(local, null, 2))

    zip.generateAsync({ type: "blob" })
      .then(function(blob) {
        saveAs(blob, `Elem4-${Date.now()}.zip`);
      });
  });
}

function exportToJson(idbDatabase, cb) {
  const exportObject = {};
  const objectStoreNamesSet = new Set(idbDatabase.objectStoreNames);
  const size = objectStoreNamesSet.size;
  if (size === 0) {
    cb(null, JSON.stringify(exportObject));
  } else {
    const objectStoreNames = Array.from(objectStoreNamesSet) as string[];
    const transaction = idbDatabase.transaction(
        objectStoreNames,
        'readonly'
    );
    transaction.onerror = (event) => cb(event, null);

    objectStoreNames.forEach((storeName) => {
      const allObjects = {};
      transaction.objectStore(storeName).openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          allObjects[cursor.key] = cursor.value;
          cursor.continue();
        } else {
          exportObject[storeName] = allObjects;
          if (
            objectStoreNames.length ===
            Object.keys(exportObject).length
          ) {
            cb(null, exportObject);
          }
        }
      };
    });
  }
}
