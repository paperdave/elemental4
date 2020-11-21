import { decreaseThemePriority, disableTheme, enableTheme, increaseThemePriority, ThemeEntry, uninstallTheme } from "../theme";
import { escapeHTML } from "../../../shared/shared";
import { openDevThemeEditor } from "../theme-editor";
import { getEnabledThemeList, getThemeList, updateMountedCss } from "../theme";
import { PromptDialog } from "../dialog";
import { addDLCByUrl } from "../dlc-fetch";

export let themeUpdated = false;
export function setThemeUpdated(val: boolean) {themeUpdated = val;}

export function ThemeDOM(theme: ThemeEntry) {
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

export function themeSettings() {
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
  document.querySelector('#theme-browse').addEventListener('click', () => {
    window.open('/workshop#themes', '', 'width=800,height=600', true);
  });
  document.querySelector('#theme-devmode').addEventListener('click', () => {
    openDevThemeEditor();
  });
  document.querySelector('#theme-apply').addEventListener('click', () => {
    updateMountedCss();
    setThemeUpdated(false);
  });
  document.querySelector('#theme-add').addEventListener('click', async() => {
    const text = await PromptDialog({
      title: 'Add Theme',
      text: 'Paste the Theme URL or JSON content here.',
      confirmButton: 'Add Theme',
      cancelButton: 'Cancel',
    });

    if (text) {
      addDLCByUrl(text, 'theme');
    }
  });
}
