import Color from "color";
import { ElementalColorPalette } from "../../shared/elem";
import { E4ColorPalette } from "../../shared/elemental4-types";
import { delay } from "../../shared/shared";
import { addDLCByUrl } from "./dlc-fetch";
import { version } from "../../package.json";
import { getInstalledThemes, installThemes, uninstallThemes } from "./savefile";

let init = false;

export const THEME_VERSION = 1;

export type SoundId = string;

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

export type ThemeSound = ThemeSoundSingle | ThemeSoundSprite;
export interface ThemeSoundSingle {
  src: string | string[];
  id: string;
}
export interface ThemeSoundSprite {
  src: string | string[];
  sprites: Partial<Record<SoundId, [number, number]>>;
}

export interface Theme {
  sounds: ThemeSound[];
  music: string[];
  colors: Partial<Record<E4ColorPalette, ThemeColorConfig>>;
  styles: string | string[];
  sketch?: string;
}

export interface ThemeFlattenedColors {
  sounds: Partial<Record<SoundId, string>>;
  music: string[];
  colors: Record<ElementalColorPalette, ThemeColorConfigWithColor>;
  styles: string;
}

export interface ThemeEntry extends Partial<Theme> {
  type: 'elemental4:theme',
  isBuiltIn: boolean;
  version: typeof THEME_VERSION,
  id: string,
  name: string,
  author: string,
  description: string,
  icon: string;
  sketch?: string;
}
const builtin_theme_urls: [string, string][] = [
  ['elem4_default', '/themes/elem4_default'],
  ['elem4_dark', '/themes/elem4_dark'],
];

let themes = [];
let themesEnabled: string[] = JSON.parse(localStorage.getItem('config-theme-order') || '[]');

export function getThemeList(): ThemeEntry[] {
  return themes;
}

const joinIfArray = (x: string|string[]) => typeof x === 'string' ? x : x.join('\n');

let currentTheme: ThemeFlattenedColors;

export function getTheme(): ThemeFlattenedColors {
  return currentTheme;
}

export function getEnabledThemeList(): string[] {
  return themesEnabled;
}

export function calculateTheme() {
  const all = getThemeList();

  const theme = {
    sounds: {},
    music: [],
    colors: {},
    styles: '',
    sketch: ''
  };

  themesEnabled
    .concat('elem4_default')
    .reverse()
    .map(x => all.find(y => y.id === x))
    .filter(Boolean)
    .forEach((next) => {
      if(next.sounds) theme.sounds = { ...theme.sounds, ...next.sounds }
      if(next.colors) theme.colors = { ...theme.colors, ...next.colors }
      if(next.music) theme.music = [ ...theme.music, ...next.music ]
      if(next.styles) theme.styles = joinIfArray(theme.styles) + '\n' + joinIfArray(next.styles);
      if(next.sketch) theme.sketch = theme.sketch;
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
}
export function uninstallTheme(id) {
  uninstallThemes(id);
}

function getCSS() {
  const theme = getTheme();
  return theme.styles + '\n' + ([
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
  ] as E4ColorPalette[]).map(x => `[data-color="${x}"]{--color:${theme.colors[x].color}}`).join('');
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
  init = true;
  updateMountedCss();
}
export async function updateMountedCss() {
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
  style.innerHTML = getCSS();
  if(oldStyle) {
    swapOverlay.style.opacity = '1';
    swapOverlay.style.transitionDuration = '150ms';
    await delay(150);
  }
  document.head.appendChild(style);
  if(oldStyle) {
    oldStyle.remove();
    await delay(20);
    swapOverlay.style.transitionDuration = '300ms';
    swapOverlay.style.opacity = '0';
  }
  swapOverlay.style.pointerEvents = 'none';
}
