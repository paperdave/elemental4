import { ThemeEntry } from "../ts/theme"
import { THEME_VERSION } from "../ts/theme-version"

const name = 'Using p5.js';

const json: Omit<ThemeEntry, "isBuiltIn"> = {
  type: 'elemental4:theme',
  format_version: THEME_VERSION,
  id: 'example',
  version: 1,
  name: 'Example: Using p5.js',
  description: 'An example theme to show the basics.',
  author: 'Dave Caruso',
  icon: '/developer.png'
}

const style = ``

const sketch = `let freqX, freqY, modx, mody

function setup() {
  colorMode(HSB, 360, 100, 100, 1)
  noFill()
  frameRate(30)

  randomOne()
}

function randomOne() {
  freqX = floor(random(1, 25))
  freqY = floor(random(1, 25))
  modx = floor(random(1, 25))
  mody = floor(random(1, 25))
}

function addVert(i) {
  curveVertex(
    sin(i * freqX + radians(frameCount*0.5)) * cos(i * modx) * width/2,
    sin(i * freqY) * cos(i * mody) * height/2
  )
}

function draw() {
  clear()

  translate(width / 2, height / 2)
  beginShape()
  let i = 0
  addVert(i)
  for (i; i < TWO_PI; i += TWO_PI / 360) addVert(i)
  addVert(i)
  endShape()
}
`


export {
  name,
  json,
  style,
  sketch,
}
