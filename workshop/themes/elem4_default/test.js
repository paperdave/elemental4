let freqX, freqY, modx, mody

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
    sin(i * freqX + radians(frameCount*0.2)) * cos(i * modx) * width/2,
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
