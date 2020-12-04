import P5 from 'p5';
import { Elem } from "../../shared/elem";
import { getAPI } from "./api";
import { getTheme } from "./theme";
interface Tree {
  /** The element itself. */
  elem: Elem;
  /** Parent 1. null if no parents (a base element) */
  parent1: Tree | null;
  /** Parent 2. null if no parents OR the parent1 is combined with itself */
  parent2: Tree | null;
}

export async function getElementTree(elem: Elem): Promise<Tree|null> {
  if (elem.stats.simplestRecipe && elem.stats.simplestRecipe.length > 0) {
    return {
      elem: elem,
      parent1: await getElementTree(await getAPI().getElement(elem.stats.simplestRecipe[0])),
      parent2: elem.stats.simplestRecipe[1] === elem.stats.simplestRecipe[0]
        ? null
        : await getElementTree(await getAPI().getElement(elem.stats.simplestRecipe[1])),
    }
  } else {
    return {
      elem: elem,
      parent1: null,
      parent2: null,
    }
  }
}

let p5: P5 | null = null;
let container: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let currentTree: Tree;
const elementSize = 35; // Dont change this, use scale to change the size instead
const treeCanvasSizeX = 350; // HARDCODED!
const treeCanvasSizeY = 400; // HARDCODED!
let treePosX = 175;
let treePosY = 350;
let scale = 1;

let drawnElement: string[] = []
const maxSpace = 3;
const minSpace = 0.8;
  
function addText(text: string, x: number, y: number, whiteText = false) {
  const padding = 4
  if (whiteText) {
    p5.fill(255)
  } else {
    p5.fill(0)
  }
  p5.textSize(10)
  // TODO: Add dynamic text scaling (Low priority)
  p5.text(text, x + padding, y + padding, elementSize - padding, elementSize - padding)
}

function makeElement(color: string, text: string, x: number, y: number, cx: number, cy: number) {
  p5.fill(p5.color(color))
  p5.rect(x + cx, y + cy, elementSize, elementSize, 4)
  if (color === "rgb(0, 0, 0)") {
    addText(text, x + cx, y + cy + (elementSize/2) - 8, true)
  } else {
    addText(text, x + cx, y + cy + (elementSize/2) - 8)
  }
  p5.strokeWeight(2)
  // up
  p5.line(x+(elementSize/2),y,x+(elementSize/2),y-(elementSize / 8));
  // line (left or right)
  p5.line(x+(elementSize/2),y-(elementSize / 8),x+cx+(elementSize/2),y-(elementSize / 8));
  // up again
  p5.line(x+cx+(elementSize/2),y-(elementSize / 8),x+cx+(elementSize/2),y+cy+(elementSize));
  p5.strokeWeight(0)
}

function addParents(tree: Tree, x: number, y: number) {
  /*
  I am not proud of the amount of if statements and 
  repetition on this function ~Zelo101
  */
  let yChange = 45
  const parent1Exist = (tree.parent1 !== null) ? true : false
  const parent2Exist = (tree.parent2 !== null) ? true : false
  const singleParent = (parent1Exist && !parent2Exist) ? true : false
  const parentIsStarterElement =
    (parent1Exist && tree.parent1.elem.stats.treeComplexity === 0) ||
    (parent2Exist && tree.parent2.elem.stats.treeComplexity === 0)
      ? true
      : false
  const alreadyDrawn =
      (drawnElement.includes(tree.elem.id) && tree.elem.stats.treeComplexity !== 0)
        ? true
        : false
  const treeComplex =
    (parent1Exist && parent2Exist)
      ? Math.max(tree.parent1.elem.stats.treeComplexity, tree.parent2.elem.stats.treeComplexity)
      : minSpace
  const parentIsAlreadyDrawn =
    (parent1Exist && drawnElement.includes(tree.parent1.elem.id)) ||
    (parent2Exist && drawnElement.includes(tree.parent2.elem.id))
      ? true
      : false
  
  let space = Math.max(Math.min(treeComplex/1.7,maxSpace),minSpace) // bad/unclear name
  // console.log(treeComplex)
  if (parent1Exist && tree.parent1.parent2 !== null) space = minSpace * 7;
  if (parentIsStarterElement) space = minSpace;
  if (parentIsAlreadyDrawn) space = minSpace;

  if (alreadyDrawn) {
    p5.strokeWeight(2)
    // up line 1
    p5.line(x + (elementSize / 2), y, x + (elementSize / 2), y - 5);
    // up line 2
    p5.line(x + (elementSize / 2), y - 10, x + (elementSize / 2), y - 15);
    // up line 3
    p5.line(x + (elementSize / 2), y - 20, x + (elementSize / 2), y - 25);
    p5.strokeWeight(0)
    return
  }

  // Chain element
  if (singleParent) {
    p5.strokeWeight(2)
    // up line
    p5.line(x + (elementSize / 2), y, x + (elementSize / 2), y - (elementSize / 4));
    // first line
    p5.line(x, y - (elementSize / 4), x + elementSize, y - (elementSize / 4));
    p5.strokeWeight(0)
    if (tree.parent1.parent2 !== null || tree.parent1.elem.stats.treeComplexity === 0) {
      makeElement(
        getTheme().colors[tree.parent1.elem.display.categoryName].color.toString(),
        tree.parent1.elem.display.text,
        x,y,0,-yChange-8
      )
      addParents(tree.parent1, x, y - elementSize - (elementSize/2))
    } else {
      addParents(tree.parent1, x, y - (elementSize / 4))
    }
    return
  }
  
  if (parent1Exist) {
    makeElement(
      getTheme().colors[tree.parent1.elem.display.categoryName].color.toString(),
      tree.parent1.elem.display.text,
      x,y,-30*space,-yChange
    )
    addParents(tree.parent1, x-(30*space), y-yChange)
  }
  
  if (parent2Exist) {
    makeElement(
      getTheme().colors[tree.parent2.elem.display.categoryName].color.toString(),
      tree.parent2.elem.display.text,
      x,y,30*space,-yChange
    )
    addParents(tree.parent2, x+(30*space), y-yChange)
  }
  drawnElement.push(tree.elem.id)
}

function renderTree(x: number, y: number) {
  const color = getTheme().colors[currentTree.elem.display.categoryName].color.toString();
  p5.fill(color)
  p5.rect(x, y, elementSize, elementSize, 4)
  if (color === "rgb(0, 0, 0)") {
    addText(currentTree.elem.display.text, x, y+7.5, true)
  } else {
    addText(currentTree.elem.display.text, x, y+7.5)
  }
  addParents(currentTree, x, y);
}

function setup() {
  p5.createCanvas(treeCanvasSizeX,treeCanvasSizeY)
  // console.log(getTheme().colors[currentTree.elem.display.categoryName].color.toString())
  
  treePosX = 175;
  treePosY = 350;
  p5.strokeWeight(0)
  p5.textAlign("center")
  scale = 1;

  renderTree(175, 350);
}

function draw() {
  // Mouse panning... kinda
  drawnElement.length = 0
  // console.log(scale)
  p5.scale(scale)
  if (p5.mouseIsPressed) {
    // console.log("Mouse pressed")
    // console.log(treePosX,treePosY)
    p5.background(200)
    renderTree(treePosX, treePosY);
  }
}

export async function initTreeCanvas(tree: Tree) {
  endTreeCanvas();
  container = document.getElementById("element-info-tree") as HTMLCanvasElement;
  currentTree = tree;

  if (window['p5']) {
    p5 = new window['p5']((instance) => {
      p5 = instance
      p5.setup = setup;
      p5.draw = draw;
      p5.mouseWheel = (event: WheelEvent) => {
        scale -= event.deltaY / 1000;
        p5.background(200);
        renderTree(treePosX, treePosY);
      }
      p5.mouseDragged = () => {
        treePosX += (p5.mouseX - p5.pmouseX) / scale;
        treePosY += (p5.mouseY - p5.pmouseY) / scale;
      }
    }, container);
  }
}
export async function endTreeCanvas() {
  if (p5) {
    p5.remove();
  }
  currentTree = null;
}
