import { ThemeEntry } from "../ts/theme"
import { THEME_VERSION } from "../ts/theme-version"

const name = 'Developer Default';

const json: Omit<ThemeEntry, "isBuiltIn"> = {
  type: 'elemental4:theme',
  format_version: THEME_VERSION,
  id: 'example',
  version: 1,
  name: 'Default Example',
  description: 'An example theme to show the basics.',
  author: 'Dave Caruso',
  icon: '/developer.png'
}

const style = `:root {
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

const sketch = `// p5.js code for custom backgrounds, see https://p5js.org/ for more info
// there is one small modification, which is that you do not need to call createCanvas
// leave this tab blank or untouched to disable.

function setup() {
  
}

function draw() {
  background(0, 0, 0, 0);
}
`


export {
  name,
  json,
  style,
  sketch,
}
