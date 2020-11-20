import { getConfigBoolean, setConfigBoolean, getConfigString, setConfigString, installServer } from "../savefile";

export function generalSettings() {
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
  }
  const playNewsSound = getConfigBoolean('config-play-news-sound', true);
  if (playNewsSound) {
    (document.querySelector('#play-news-sound') as HTMLInputElement).checked = true;
  }
  const showInternal = getConfigBoolean('config-show-internal-servers', false);
  if (showInternal) {
    (document.querySelector('#show-internal-servers') as HTMLInputElement).checked = true;
  }

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
  document.querySelector('#play-news-sound').addEventListener('click', (ev) => {
    const v = (ev.currentTarget as HTMLInputElement).checked;
    setConfigBoolean('config-play-news-sound', v);
  })
  document.querySelector('#show-internal-servers').addEventListener('click', (ev) => {
    const v = (ev.currentTarget as HTMLInputElement).checked;
    setConfigBoolean('config-show-internal-servers', v);
    installServer(null, null)
  })

  document.querySelector("#element-scale").addEventListener('click', (ev) => {
    const v = (ev.currentTarget as HTMLInputElement).value;
    setConfigString('element-scale', v);
    document.body.setAttribute('data-element-scale', v);
  });
}
