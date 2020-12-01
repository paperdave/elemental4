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
  /** The amount of unique children needed to make the element */
  children: number;
}

export async function getElementTree(elem: Elem): Promise<Tree|null> {
  if (elem.stats.simplestRecipe && elem.stats.simplestRecipe.length > 0) {
    return {
      elem: elem,
      parent1: await getElementTree(await getAPI().getElement(elem.stats.simplestRecipe[0])),
      parent2: elem.stats.simplestRecipe[1] === elem.stats.simplestRecipe[0]
        ? null
        : await getElementTree(await getAPI().getElement(elem.stats.simplestRecipe[1])),
      children: 0,
    }
  } else {
    return {
      elem: elem,
      parent1: null,
      parent2: null,
      children: 0,
    }
  }
}

let p5: P5 | null = null;
let container: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let currentTree: Tree;
const elementSize = 35;
const treeCanvasSizeX = 350;
const treeCanvasSizeY = 400;
let treePosX = 175;
let treePosY = 350;
let scale = 1;

function presolveTree() {

}
function addText(text: string, x: number, y: number) {
  p5.fill(0)
  p5.textSize(10)
  // TODO: Add dynamic text scaling (Low priority)
  p5.text(text, x, y, elementSize, elementSize)
}
function makeElement(color: string, text: string, x: number, y: number, cx: number, cy: number) {
  p5.fill(p5.color(color.toString()))
  p5.rect(x+cx, y+cy, elementSize, elementSize, 4)
  addText(text, x + cx, y + cy + (elementSize/2))
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
  let yChange = 45
  const parent1Exist = (tree.parent1 !== null) ? true : false
  const parent2Exist = (tree.parent2 !== null) ? true : false
  const singleParent = ((parent1Exist || parent2Exist) && !(parent1Exist && parent2Exist)) ? true : false

  if (singleParent) {
    p5.strokeWeight(2)
    // up line
    p5.line(x + (elementSize / 2), y, x + (elementSize / 2), y - (elementSize / 4));
    // first line
    p5.line(x, y - (elementSize / 4), x + elementSize, y - (elementSize / 4));
    p5.strokeWeight(0)
    addParents(tree.parent1, x, y - (elementSize / 4))
    return
  }
  
  if (parent1Exist) {
    makeElement(
      getTheme().colors[tree.parent1.elem.display.categoryName].color,
      tree.parent1.elem.display.text,
      x,y,-30,-yChange
    )
    addParents(tree.parent1, x+25, y-yChange)
  }
  
  if (parent2Exist) {
    makeElement(
      getTheme().colors[tree.parent2.elem.display.categoryName].color,
      tree.parent2.elem.display.text,
      x,y,30,-yChange
    )
    addParents(tree.parent2, x+50, y-yChange)
  }
}
function renderTree(x: number, y: number) {
  p5.fill(p5.color(getTheme().colors[currentTree.elem.display.categoryName].color.toString()))
  p5.rect(x, y, elementSize, elementSize, 4)
  addText(currentTree.elem.display.text, x, y+7.5)
  addParents(currentTree, x, y);
}
function setup() {
  p5.createCanvas(treeCanvasSizeX,treeCanvasSizeY)
  console.log(getTheme().colors[currentTree.elem.display.categoryName].color.toString())
  p5.strokeWeight(0)
  renderTree(175, 350);
}
function draw() {
  // Mouse panning... kinda
  console.log(scale)
  p5.scale(scale)
  if (p5.mouseIsPressed) {
    // console.log("Mouse pressed")
    // console.log(treePosX,treePosY)
    p5.background(255)
    renderTree(treePosX, treePosY);
  }

  // TODO: Mouse panning to move the tree
  /*
  We could very lazily do the whole thing every frame,
  or we could redo the code to only compute the tree once, also
  allowing us to do the spacing thingy i mentioned in the
  discord. I'm probably going to do the latter. ~Zelo101

  Edit: I did it the lazy way, but it doesn't seem to have an
  affect on performace, so lol ~Zelo101
  */
}

export async function initTreeCanvas(tree: Tree) {
  endTreeCanvas();
  container = document.getElementById("element-info-tree") as HTMLCanvasElement;
  currentTree = tree;
  p5 = new P5((instance) => {
    p5 = instance
    p5.setup = setup;
    p5.draw = draw;
    p5.mouseWheel = (event: WheelEvent) => {
      scale -= event.deltaY / 1000;
      p5.background(255);
      renderTree(treePosX, treePosY);
    }
    p5.mouseDragged = () => {
      treePosX += (p5.mouseX - p5.pmouseX) / scale;
      treePosY += (p5.mouseY - p5.pmouseY) / scale;
    }
  }, container);
}
export async function endTreeCanvas() {
  if (p5) {
    p5.remove();
  }
  treePosX = 175;
  treePosY = 350;
  currentTree = null;
}
