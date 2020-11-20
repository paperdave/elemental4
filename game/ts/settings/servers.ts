import { escapeHTML } from "../../../shared/shared";
import { animateDialogOpen, ConfirmDialog, CustomDialog, PromptDialog } from "../dialog";
import { addDLCByUrl } from "../dlc-fetch";
import { builtInOfficialServers, setActiveServer } from "../server-manager";
import { processBaseUrl, getActiveSaveFile, createNewSaveFile, renameSaveFile, deleteSaveFile, setActiveSaveFile, getAPISaveFiles, uninstallServer } from "../savefile";
import escapeMarkdown from 'markdown-escape';
import { createLoadingUi } from "../loading";
import { setAPISaveFile, connectApi, getAPI, recalculateSavefileDropdown } from "../api";

export function serverSettings() {
  document.querySelector("#server-connect-main").addEventListener('click', () => {
    connectApi(builtInOfficialServers[0], null, null);
  });
  
  document.querySelector('#server-add').addEventListener('click', async() => {
    
    const text = await PromptDialog({
      title: 'Add Server',
      text: 'Paste the Server URL here.',
      confirmButton: 'Add Server',
      cancelButton: 'Cancel',
    });

    if (text) {
      await addDLCByUrl(text, 'server');
    }
  });
  document.querySelector('#server-remove').addEventListener('click', async() => {
    const conf = getAPI().config;
    if(await ConfirmDialog({
      title: 'Remove Server',
      text: `Remove **${escapeMarkdown(conf.name || `Untitled Server (type=${conf.type})`)}**? This will remove all downloaded server data, and your local save files.`
    })) {
      await uninstallServer(getAPI().baseUrl);
    }
  });

  const serverSelect = document.querySelector('#change-server') as HTMLSelectElement;
  serverSelect.value = 'internal:change-btn';
  serverSelect.addEventListener('change', async() => {
    const baseUrl = serverSelect.value;
    if (baseUrl && baseUrl !== 'internal:change-btn') {
      const ui = createLoadingUi();
      ui.status('Connecting to ' + processBaseUrl(baseUrl), 0)
      ui.show();
      setActiveServer(baseUrl);
      document.querySelector('.suggest-close').dispatchEvent(new MouseEvent('click'));
      try {
        await connectApi(baseUrl, null, ui);
      } catch (error) {
        await CustomDialog({
          title: 'Server Connection Error',
          parts: [
            `Could not connect to \`${escapeHTML(baseUrl)}\``,
            `\`${error.stack}\``
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
      const name = await PromptDialog({
        title: 'Create Save File',
        text: 'Enter the savefile name',
        defaultInput: `Save #${saveSelect.options.length + 1}`,
        confirmButton: 'Create'
      });
      if(name) {
        await createNewSaveFile(api, name);
        recalculateSavefileDropdown();
      }
    } else if(value === 'rename') {
      const name = await PromptDialog({
        title: 'Rename Save File',
        text: 'Enter the savefile name',
        defaultInput:`${saveSelect.options[saveSelect.selectedIndex].text}`,
        confirmButton: 'Rename'
      });
      if(name) {
        await renameSaveFile(api, await getActiveSaveFile(api), name);
        recalculateSavefileDropdown();
      }
    } else if(value === 'delete') {
      const confirm = await ConfirmDialog({
        title: 'Delete Save File',
        text: 'Are you sure you want to delete this save file?',
        trueButton: 'Delete',
        falseButton: 'Keep'
      });
      if(confirm) {
        await deleteSaveFile(api, await getActiveSaveFile(api));
        setActiveSaveFile(api, (await getAPISaveFiles(api))[0].id);
        recalculateSavefileDropdown();
      }
    }
    saveModifySelect.value = 'title'
  });
}
