import { ThemeEntry } from "../ts/theme"
import { THEME_VERSION } from "../ts/theme-version"

const name = 'Customizing Colors';

const json: Omit<ThemeEntry, "isBuiltIn"> = {
  type: 'elemental4:theme',
  format_version: THEME_VERSION,
  id: 'example',
  version: 1,
  name: 'Example: Customizing Colors',
  description: 'An example theme to show the basics.',
  author: 'Dave Caruso',
  colors: {
    red: {
      color: '#00ff00',
      lightnessMultiplier: 1,
      saturationMultiplier: 1,
    },
    green: {
      color: '#ff0000',
      lightnessMultiplier: 0.5,
      saturationMultiplier: 0,
    },
    blue: {
      color: '#5555ff',
      lightnessMultiplier: 2,
      saturationMultiplier: 0.25,
    },
  },
  icon: '/developer.png'
}

const style = ``

const sketch = require('./default').sketch


export {
  name,
  json,
  style,
  sketch,
}
