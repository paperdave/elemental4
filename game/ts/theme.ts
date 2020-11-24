import Color from "color";
import { ElementalColorPalette } from "../../shared/elem";
import { E4ColorPalette } from "../../shared/elemental4-types";
import { delay } from "../../shared/shared";
import { addDLCByUrl, DLCType } from "./dlc-fetch";
import { version } from "../../package.json";
import { getInstalledThemes, installThemes, uninstallThemes } from "./savefile";
import { reloadAudio, SoundId } from "./audio";
import { addThemeToUI } from "./settings/theme";
import { THEME_VERSION } from "./theme-version";
import { ConfirmDialog } from "./dialog";
import { capitalize } from "@reverse/string";
import { reloadElementCssColors } from "./element-color";
import { createQueueExec } from "../../shared/async-queue-exec";

let init = false;

export interface ThemeColorConfig {
  color: string;
  saturationMultiplier: number;
  lightnessMultiplier: number;
}
export interface ThemeColorConfigWithColor {
  color: Color;
  saturationMultiplier: number;
  lightnessMultiplier: number;
}

export interface SoundEntry {
  url: string;
  volume?: number;
  pitch?: number;
  pitchVariance?: number;
}

export interface MusicEntry {
  url: string;
  fade: 'fade-anywhere' | 'no-fade' | 'fade-both' | 'fade-start' | 'fade-end';
  loop: [number, number] | 'loop' | 'no-loop';
  title: string;
  author: string;
  volume?: number;
}

export interface Theme {
  sounds: Record<SoundId, SoundEntry[]>;
  music: ThemeMusic[];
  colors: Partial<Record<E4ColorPalette, ThemeColorConfig>>;
  styles: string | string[];
  sketch?: string;
}

export interface ThemeFlattenedColors {
  sounds: Partial<Record<SoundId, string>>;
  music: ThemeMusic[];
  colors: Record<ElementalColorPalette, ThemeColorConfigWithColor>;
  styles: string[];
  sketch: string;
  style_developer: string;
  sketch_developer: string;
}

export interface ThemeMusic {
  id: string,
  name: string,
  tracks: MusicEntry[]
}

export interface ThemeEntry extends Partial<Theme> {
  type: 'elemental4:theme',
  isBuiltIn: boolean;
  format_version: typeof THEME_VERSION,
  version: number,
  id: string,
  name: string,
  author: string,
  description: string,
  icon: string;
  sketch?: string;
  sound_merge_mode?: 'merge' | 'override';
  music_merge_mode?: 'merge' | 'override';
}
const builtin_theme_urls: [string, string, number][] = [
  ['elem4_default', '/themes/elem4_default', 2],
  ['elem4_dark', '/themes/elem4_dark', 1],
];

let themes = [];
let themesEnabled: string[] = JSON.parse(localStorage.getItem('config-theme-order') || '[]');

export function getThemeList(): ThemeEntry[] {
  return themes;
}

let currentTheme: ThemeFlattenedColors;

export function getTheme(): ThemeFlattenedColors {
  return currentTheme;
}

export function getEnabledThemeList(): string[] {
  return themesEnabled;
}

export function resetBuiltInThemes() {
  return builtin_theme_urls.map((x) => uninstallTheme(x[0]));
}

export function calculateTheme() {
  const all = getThemeList();

  const theme = {
    sounds: {},
    music: [],
    colors: {},
    styles: [],
    sketch: '',
    sketch_developer: '',
    style_developer: '',
  };

  themesEnabled
    .concat('elem4_default')
    .reverse()
    .map(x => all.find(y => y.id === x))
    .filter(Boolean)
    .forEach((next) => {
      if(next.sounds) {
        if (next.sound_merge_mode === 'merge') {
          theme.sounds = { ...theme.sounds, ...next.sounds }
        } else {
          theme.sounds = next.sounds
        }
      }
      if(next.colors) theme.colors = { ...theme.colors, ...next.colors }
      if(next.music) theme.music = theme.music.concat({
        id: next.id,
        name: next.name,
        tracks: next.music
      })
      if(next.styles) theme.styles = Array.isArray(next.styles) ? theme.styles.concat(...next.styles) : theme.styles.concat(next.styles);
      if(next.sketch) theme.sketch = next.sketch;
      if((next as any).style_developer) theme.style_developer = (next as any).style_developer;
      if((next as any).sketch_developer) theme.sketch_developer = (next as any).sketch_developer;
    });
  
  currentTheme = {
    colors: {
      'white': { ...theme.colors['white'], color: Color(theme.colors['white'].color) },
      'black': { ...theme.colors['black'], color: Color(theme.colors['black'].color) },
      'light-grey': { ...theme.colors['grey'], color: Color(theme.colors['grey'].color).lighten(0.5) },
      'grey': { ...theme.colors['grey'], color: Color(theme.colors['grey'].color) },
      'dark-grey': { ...theme.colors['grey'], color: Color(theme.colors['grey'].color).darken(0.5) },
      'brown': { ...theme.colors['brown'], color: Color(theme.colors['brown'].color) },
      'dark-brown': { ...theme.colors['brown'], color: Color(theme.colors['brown'].color).darken(0.5) },
      'red': { ...theme.colors['red'], color: Color(theme.colors['red'].color) },
      'dark-red': { ...theme.colors['red'], color: Color(theme.colors['red'].color).darken(0.5) },
      'pink': { ...theme.colors['red'], color: Color(theme.colors['red'].color).lighten(0.3) },
      'orange': { ...theme.colors['orange'], color: Color(theme.colors['orange'].color) },
      'dark-orange': { ...theme.colors['orange'], color: Color(theme.colors['orange'].color).darken(0.5) },
      'yellow': { ...theme.colors['yellow'], color: Color(theme.colors['yellow'].color) },
      'dark-yellow': { ...theme.colors['yellow'], color: Color(theme.colors['yellow'].color).darken(0.5) },
      'yellow-green': { ...theme.colors['yellow-green'], color: Color(theme.colors['yellow-green'].color) },
      'dark-yellow-green': { ...theme.colors['yellow-green'], color: Color(theme.colors['yellow-green'].color).darken(0.5) },
      'green': { ...theme.colors['green'], color: Color(theme.colors['green'].color) },
      'dark-green': { ...theme.colors['green'], color: Color(theme.colors['green'].color).darken(0.5) },
      'aqua': { ...theme.colors['aqua'], color: Color(theme.colors['aqua'].color) },
      'dark-aqua': { ...theme.colors['aqua'], color: Color(theme.colors['aqua'].color).darken(0.5) },
      'blue': { ...theme.colors['blue'], color: Color(theme.colors['blue'].color) },
      'dark-blue': { ...theme.colors['dark-blue'], color: Color(theme.colors['dark-blue'].color) },
      'navy-blue': { ...theme.colors['dark-blue'], color: Color(theme.colors['dark-blue'].color).darken(0.5) },
      'purple': { ...theme.colors['purple'], color: Color(theme.colors['purple'].color) },
      'dark-purple': { ...theme.colors['purple'], color: Color(theme.colors['purple'].color).darken(0.5) },
      'magenta': { ...theme.colors['magenta'], color: Color(theme.colors['magenta'].color) },
      'dark-magenta': { ...theme.colors['magenta'], color: Color(theme.colors['magenta'].color).darken(0.5) },
      'hot-pink': { ...theme.colors['hot-pink'], color: Color(theme.colors['hot-pink'].color) },
      'dark-hot-pink': { ...theme.colors['hot-pink'], color: Color(theme.colors['hot-pink'].color).darken(0.5) },
    },
    music: theme.music,
    sounds: theme.sounds,
    styles: theme.styles,
    sketch: theme.sketch,
    sketch_developer: theme.sketch_developer,
    style_developer: theme.style_developer,
  };
}

export function enableTheme(id) {
  themesEnabled = [...new Set([id, ...themesEnabled])];
}
export function disableTheme(id) {
  themesEnabled = themesEnabled.filter(x => x !== id);
}
export function decreaseThemePriority(id) {
  const index = themesEnabled.indexOf(id);
  if (index === -1 || index === 0) {
    return
  }
  const old = themesEnabled[index - 1];
  themesEnabled[index - 1] = id;
  themesEnabled[index] = old;
}
export function increaseThemePriority(id) {
  const index = themesEnabled.indexOf(id);
  if (index === -1 || index === themesEnabled.length - 1) {
    return
  }
  const old = themesEnabled[index + 1];
  themesEnabled[index + 1] = id;
  themesEnabled[index] = old;
}
export async function installTheme(theme: ThemeEntry, switchTo: boolean) {
  await installThemes(theme);
  themes = await getInstalledThemes();
  if (switchTo && init) {
    enableTheme(theme.id);
    await updateMountedCss();
  }
  if (init) {
    addThemeToUI(theme);
  }
}
export function uninstallTheme(id) {
  uninstallThemes(id);
}

function getCSS() {
  const theme = getTheme();
  const css = theme.styles.map(x => `@import "${x}";`).join('\n') + '\n' + ([
    'white',
    'black',
    'grey',
    'brown',
    'red',
    'orange',
    'yellow',
    'yellow-green',
    'green',
    'aqua',
    'blue',
    'dark-blue',
    'purple',
    'magenta',
    'hot-pink',
  ] as E4ColorPalette[]).map(x => `[data-color="${x}"]{--color:${theme.colors[x].color}}`).join('\n');
  return css;
}

const swapOverlay = document.querySelector('#THEME_SWAP_OVERLAY') as HTMLElement;

declare const $production: boolean;

let style: HTMLStyleElement;
export async function MountThemeCSS() {
  themes = await getInstalledThemes();

  await Promise.all(
    ($production
      ? builtin_theme_urls.filter(x => !themes.some(y => y.id === x[0] && y.version === version))
      : builtin_theme_urls)
    .map((x) => {
      return addDLCByUrl(x[1], 'theme', true);
    })
  );
  await delay(100)
  init = true;
}

export async function showThemeAddDialog() {
  try {
    const obj = JSON.parse(localStorage.getItem('workshop_add'))
    localStorage.removeItem('workshop_add');
    if (obj && obj.url && obj.type) {
      if(await ConfirmDialog({
        title: 'Add ' + capitalize(obj.type) + '?',
        text: `You are about to install DLC from \`${obj.url}\`, make sure you trust the content you are installing.`,
        trueButton: 'Add DLC'
      })) {
        await addDLCByUrl(obj.url, obj.type);
      }
    }
    localStorage.setItem('close_workshop_dialog', obj.date)
  } catch (error) {
    
  }

  const addDLCPopup = createQueueExec(async(url: string, type: DLCType) => {
    if(await ConfirmDialog({
      title: 'Add ' + capitalize(type) + '?',
      text: `You are about to install DLC from \`${url}\`, make sure you trust the content you are installing.`,
      trueButton: 'Add DLC'
    })) {
      await addDLCByUrl(url, type);
    }
  })

  window.addEventListener('storage', async(e) => {
    if(e.key == "workshop_add") {
      try {
        const obj = JSON.parse(localStorage.getItem('workshop_add') || 'x')
        localStorage.removeItem('workshop_add');
        if (obj.url && obj.type) {
          await addDLCPopup(obj.url, obj.type);
        }
        localStorage.setItem('close_workshop_dialog', obj.date)
      } catch (error) {

      }
    }
  })
}
let themeSketchObjectUrl = null;
export async function updateMountedCss(animate = true) {
  swapOverlay.style.pointerEvents = 'all';
  const string = JSON.stringify(themesEnabled);
  if(string === '[]') {
    localStorage.removeItem('config-theme-order');
  } else {
    localStorage.setItem('config-theme-order', string);
  }
  const oldStyle = style;
  style = document.createElement("style");
  calculateTheme();

  if (themeSketchObjectUrl) {
    URL.revokeObjectURL(themeSketchObjectUrl);
    themeSketchObjectUrl = null;
  }
  
  const theme = getTheme();
  let sketchURL = theme.sketch || '';
  if (theme.sketch_developer) {
    sketchURL = themeSketchObjectUrl = URL.createObjectURL(new Blob([ theme.sketch_developer ]))
  }
  const p5 = document.getElementById('p5_background') as HTMLIFrameElement;
  if (sketchURL) {
    p5.src = '/p5_background?sketch=' + btoa(await fetch(sketchURL).then(x => x.text()));
  } else {
    p5.src = 'about:blank';
  }

  style.innerHTML = getCSS();
  if (oldStyle && animate) {
    swapOverlay.style.opacity = '1';
    swapOverlay.style.transitionDuration = '150ms';
    await delay(150);
  }
  document.head.appendChild(style);
  if (oldStyle) {
    await reloadAudio();
    await delay(20);
    oldStyle.remove();
    reloadElementCssColors()
    if (animate) {
      await delay(20);
      swapOverlay.style.transitionDuration = '300ms';
      swapOverlay.style.opacity = '0';
    }
  }
  swapOverlay.style.pointerEvents = 'none';
}

export function getMusicTracks(): MusicEntry[] {
  return currentTheme.music.flatMap(x => x.tracks)
}
