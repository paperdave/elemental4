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
const elementSize = 35;

function addText(text: string, x: number, y: number) {
  p5.fill(0)
  p5.textSize(10)
  // TODO: Add dynamic text scaling (Low priority)
  p5.text(text, x, y, elementSize, elementSize)
}
function makeElement(color: string, text: string, x: number, y: number, cx: number, cy: number) {
  p5.fill(p5.color(color.toString()))
  p5.rect(x+cx, y+cy, elementSize, elementSize)
  addText(text, x + cx, y + cy + (elementSize/2))
  // up
  p5.line(x+(elementSize/2),y,x+(elementSize/2),y-(elementSize / 8));
  // line (left or right)
  p5.line(x+(elementSize/2),y-(elementSize / 8),x+cx+(elementSize/2),y-(elementSize / 8));
  // up again
  p5.line(x+cx+(elementSize/2),y-(elementSize / 8),x+cx+(elementSize/2),y+cy+(elementSize));
}
function addParents(tree: Tree, x: number, y: number) {
  let yChange = 45
  const parent1Exist = (tree.parent1 !== null) ? true : false
  const parent2Exist = (tree.parent2 !== null) ? true : false
  const singleParent = ((parent1Exist || parent2Exist) && !(parent1Exist && parent2Exist)) ? true : false

  if (singleParent) {
    // up line
    p5.line(x + (elementSize / 2), y,x + (elementSize / 2), y - (elementSize / 4));
    // first line
    p5.line(x, y - (elementSize / 4),x + elementSize, y - (elementSize / 4));
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
function setup() {
  p5.createCanvas(350, 400)
}
function draw() {
  // TODO: Mouse panning to move the tree
  /*
  We could very lazily do the whole thing every frame,
  or we could redo the code to only compute the tree once, also
  allowing us to do the spacing thingy i mentioned in the
  discord. I'm probably going to do the latter. ~Zelo101
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
  }, container);
  console.log(getTheme().colors[tree.elem.display.categoryName].color.toString())
  p5.fill(p5.color(getTheme().colors[tree.elem.display.categoryName].color.toString()))
  p5.rect(175, 350, elementSize, elementSize)
  addText(currentTree.elem.display.text, 175, 357.5)
  addParents(currentTree, 175, 350);
}
export async function endTreeCanvas() {
  if (p5) {
    p5.remove();
  }
  currentTree = null;
}
