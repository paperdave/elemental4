import { debounce } from "@reverse/debounce";
import JSZip from "jszip";
import { enableTheme, getThemeList, installTheme, updateMountedCss } from "./theme";
import { saveAs } from "file-saver";
import * as defaultTheme from "../theme_editor_presets/default";
import { connectApi } from "./api";

let devTheme
try {
  devTheme = JSON.parse(localStorage.getItem('developer_theme'));
  if(!devTheme) throw new Error();
} catch (error) {
  devTheme = {...defaultTheme}
}

export async function enableDeveloperTheme() {
  localStorage.setItem('developer_theme', JSON.stringify(devTheme))
  await installTheme({
    ...devTheme.json,
    isBuiltIn: false,
    id: 'internal:developer_mode',
    name: (devTheme.json && devTheme.json.name && `[Developer] ${devTheme.json.name}`) || `[Developer] Theme`,
    style_developer: devTheme.style,
    sketch_developer: devTheme.sketch.trim() !== '' && devTheme.sketch.replace(/\s/g,'') !== defaultTheme.sketch.replace(/\s/g,'') ? devTheme.sketch : '',
  }, false);
  await enableTheme('internal:developer_mode')
  await updateMountedCss(false);
}

export async function downloadDeveloperTheme() {
  var zip = new JSZip();

  const finalJSON = {
    ...devTheme.json
  };

  if (devTheme.style.trim() !== '') {
    zip.file('style.css', devTheme.style)
    finalJSON.styles = './style.css';
  }
  if (devTheme.sketch.trim() !== '' && devTheme.sketch.replace(/\s/g,'') !== defaultTheme.sketch.replace(/\s/g,'')) {
    zip.file('sketch.js', devTheme.sketch)
    finalJSON.sketch = './sketch.js';
  }
  zip.file('elemental.json', JSON.stringify(finalJSON, null, 2))

  zip.generateAsync({ type: "blob" })
    .then(function(blob) {
      saveAs(blob, 'theme.zip');
    });
}

const developerThemePresets = {
  default: defaultTheme,
  customizing_colors: require('../theme_editor_presets/customizing_colors'),
  p5_basic: require('../theme_editor_presets/p5_basic'),
}

export async function loadDeveloperThemePreset(id: string) {
  if (id.startsWith('template:')) {
    devTheme = {
      json: developerThemePresets[id.slice(9)].json,
      style: developerThemePresets[id.slice(9)].style,
      sketch: developerThemePresets[id.slice(9)].sketch,
    };
  } else if (id.startsWith('theme:')) {
    const x = getThemeList();
    const theme = x.find(y => y.id === id.slice(6));
    if(theme) {
      devTheme = {
        json: {
          ...theme,
          styles: undefined,
          sketch: undefined,
          isBuiltIn: undefined,
        },
        style: theme.styles && typeof theme.styles === 'string' ? await fetch(theme.styles).then(x => x.text()) : '',
        sketch: theme.sketch ? await fetch(theme.sketch).then(x => x.text()) : defaultTheme.sketch,
      };
    }
  }
  themeWindow && themeWindow.postMessage({
    type: 'set-theme',
    theme: devTheme
  }, '*');
  enableDeveloperTheme();
}

const updateDevTheme = debounce((x) => {
  devTheme = x;
  enableDeveloperTheme();
}, 100);

let themeWindow: Window;
let interval;
export async function openDevThemeEditor() {
  themeWindow && themeWindow.close();
  await enableDeveloperTheme();
  themeWindow = window.open('/theme_editor', '', 'width=640,height=480,menubar=no,resizable=yes,scrollbars=no,titlebar=yes,toolbar=no')
  themeWindow.addEventListener('message', ({ data }) => {
    if (data.type === 'ready') {
      themeWindow.postMessage({
        type: 'set-theme',
        theme: devTheme
      }, '*');
      themeWindow.postMessage({
        type: 'presets',
        list: getThemeList().filter(x => x.id !== 'internal:developer_mode').map((theme) => {
          return {
            id: 'theme:' + theme.id,
            name: theme.name,
            category: theme.isBuiltIn ? 'builtin' : 'custom'
          }
        }).concat(...Object.keys(developerThemePresets).map(x => {
          return {
            id: 'template:' + x,
            name: developerThemePresets[x].name,
            category: 'template'
          }
        }))
      }, '*');
    }
    if (data.type === 'update_editor') {
      updateDevTheme(data.theme);
    }
    if (data.type === 'edit') {
      updateDevTheme(data.theme);
    }
    if (data.type === 'action.preset') {
      loadDeveloperThemePreset(data.preset);
      themeWindow.postMessage({
        type: 'set-theme',
        theme: devTheme
      }, '*');
    }
    if (data.type === 'action.downloadZip') {
      downloadDeveloperTheme();
    }
    if (data.type === 'action.test_colors') {
      connectApi('internal:all-colors', null, null);
    }
  })
  if(!interval) {
    interval = setInterval(() => {
      themeWindow.postMessage({
        type: 'ping',
      }, '*');
    }, 500);
  }
}

window.addEventListener('beforeunload', () => {
  themeWindow && themeWindow.close();
})
