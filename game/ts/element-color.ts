import { getTheme } from './theme';
import Color from 'color';
import { Elem } from '../../shared/elem';
import { getAPI } from './api';

const cache = {}; 

const colorStyleTag = document.createElement('style');
document.head.appendChild(colorStyleTag);

export function getClassFromDisplay(display: Elem['display']): string {
  const key = `${display.color},${display.image}`;
  if (key in cache) return cache[key];

  const c = 'palette_' + Object.keys(cache).length;
  cache[key] = c;

  const rule = `.${c} { ${getCSSFromDisplay(display)}; }`;
  colorStyleTag.sheet.insertRule(rule, 0);

  return c;
}

export function getCSSFromDisplay(display: Elem['display']): string {
  const theme = getTheme();
  const colorConfig = theme.colors[display.color];

  let outputColor: Color;

  const paletteApi = getAPI('customPalette');
  if(paletteApi) {
    outputColor = paletteApi.lookupCustomPaletteColor(theme.colors, display.color);
  } else {
    outputColor = colorConfig.color;
  }

  return `background-color:rgb(${outputColor.red()},${outputColor.green()},${outputColor.blue()});`
    + `color:${outputColor.isLight() ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'}`;
}
