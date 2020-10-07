import { debounce } from "@reverse/debounce";
import JSZip from "jszip";
import { THEME_VERSION } from "./theme-version";
import { enableTheme, installTheme, ThemeEntry, updateMountedCss } from "./theme";

const initialDevTheme: Omit<ThemeEntry, "isBuiltIn"> = {
  type: 'elemental4:theme',
  format_version: THEME_VERSION,
  id: 'example',
  version: 1,
  name: 'Example Theme',
  description: 'An example theme to show the basics.',
  author: 'Dave Caruso',
  icon: '/developer.png'
}

const initialDevCSS = `:root {
  --text-main: black;
  --background-main: #FFFFFF;
  --background-element-game: #F1F1F1;
  --text-warning: red;
  --primary: #F8571C;
  --link-click: red;

  --background-hover: rgba(127,127,127,0.15);
  --background-active: rgba(127,127,127,0.4);
  --background-selected: rgba(127,127,127,0.3);
  --text-hover: rgba(127,127,127,0.15);
  --text-active: rgba(127,127,127,0.4);
  --text-selected: rgba(127,127,127,0.3);

  --text-top-bar: var(--background-main);
  --background-top-bar: var(--text-main);
  --background-button: var(--primary);
  --background-button-discord: #7289DA;
  --background-button-source: #7eda72;

  --text-info: var(--text-main);
  --background-info:var(--background-main);

  --text-dialog: var(--text-main);
  --background-dialog: var(--background-main);
  --text-suggest: var(--text-dialog);
  --background-suggest: var(--background-dialog);
  --background-suggest-title: var(--background-top-bar);
  --text-suggest-title: var(--text-top-bar);

  --border-info: 1px solid #000000;

  --popup-background: rgba(0, 0, 0, .25);
}
`

const initialDevSketch = `// p5.js code for custom backgrounds, see https://p5js.org/ for more info
// there is one small modification, is that you do not need to call createCanvas
// leave this tab blank or untouched to disable.

function setup() {
  
}

function draw() {
  background(default_background_color);
}
`

let devTheme
try {
  devTheme = JSON.parse(localStorage.getItem('developer_theme'));
  if(!devTheme) throw new Error();
} catch (error) {
  devTheme = {
    json: initialDevTheme,
    style: initialDevCSS,
    sketch: initialDevSketch
  };
}

export async function enableDeveloperTheme() {
  localStorage.setItem('developer_theme', JSON.stringify(devTheme))
  await installTheme({
    ...devTheme.json,
    isBuiltIn: false,
    id: 'internal:developer_mode',
    name: (devTheme.json && devTheme.json.name && `[Developer] ${devTheme.json.name}`) || `[Developer] Theme`,
    styles: devTheme.style,
    sketch: devTheme.sketch,
  }, false);
  await enableTheme('internal:developer_mode')
  await updateMountedCss();
}

export async function downloadDeveloperTheme() {
  var zip = new JSZip();

  zip.file('elemental.json', JSON.stringify(devTheme.json, null, 2))
  zip.file('style.css', devTheme.style)
  zip.file('sketch.js', devTheme.sketch)

  zip.generateAsync({ type: "blob" })
    .then(function(blob) {
      
    });
}

export async function resetDeveloperTheme() {
  devTheme = {
    json: initialDevTheme,
    style: initialDevCSS,
    sketch: initialDevSketch
  };
  enableDeveloperTheme();
}

const updateDevTheme = debounce((x) => {
  devTheme = x;
  enableDeveloperTheme();
  console.log(devTheme)
}, 1000);

let themeWindow: Window;
let interval;
export async function openDevThemeEditor() {
  await enableDeveloperTheme();
  if(themeWindow) {
    themeWindow.focus();
  } else {
    themeWindow = window.open('/theme_editor', '', 'width=640,height=480,menubar=no,resizable=yes,scrollbars=no,titlebar=yes,toolbar=no')
    themeWindow.addEventListener('message', ({ data }) => {
      if (data.type === 'ready') {
        themeWindow.postMessage({
          type: 'set-theme',
          theme: devTheme
        }, '*');
      }
      if (data.type === 'update_editor') {
        updateDevTheme(data.theme);
      }
      if (data.type === 'edit') {
        updateDevTheme(data.theme);
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
}

window.addEventListener('beforeunload', () => {
  themeWindow && themeWindow.close();
})
