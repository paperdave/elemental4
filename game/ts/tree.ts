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
  const textToAdd = text.match(/.{1,6}/g);
  textToAdd.forEach((text, i) => {
    ctx.fillStyle = "#000"
    ctx.fillText(text, x, y+(i*14))
  })
}
function makeElement(color: string, text: string, x: number, y: number, cx: number, cy: number) {
  ctx.fillStyle = color
  ctx.fillRect(x+cx, y+cy, elementSize, elementSize)
  addText(text, x + cx, y + cy + 14)
  // up
  ctx.beginPath();
  ctx.moveTo(x+(elementSize/2),y);
  ctx.lineTo(x+(elementSize/2),y-(elementSize / 8));
  ctx.stroke();
  // line (left or right)
  ctx.moveTo(x+(elementSize/2),y-(elementSize / 8));
  ctx.lineTo(x+cx+(elementSize/2),y-(elementSize / 8));
  ctx.stroke();
  // up again
  ctx.moveTo(x+cx+(elementSize/2),y-(elementSize / 8));
  ctx.lineTo(x+cx+(elementSize/2),y+cy+(elementSize));
  ctx.stroke();
}
function addParents(tree: Tree, x: number, y: number) {
  let yChange = 45
  const parent1Exist = (tree.parent1 !== null) ? true : false
  const parent2Exist = (tree.parent2 !== null) ? true : false
  const singleParent = ((parent1Exist || parent2Exist) && !(parent1Exist && parent2Exist)) ? true : false

  if (singleParent) {
    ctx.beginPath();
    // up line
    ctx.moveTo(x + (elementSize / 2), y);
    ctx.lineTo(x + (elementSize / 2), y - (elementSize / 4));
    ctx.stroke();
    // first line
    ctx.moveTo(x, y - (elementSize / 4));
    ctx.lineTo(x + elementSize, y - (elementSize / 4));
    ctx.stroke();
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
  // ctx.fillStyle = getTheme().colors[tree.elem.display.categoryName].color
  // ctx.fillRect(175, 350, elementSize, elementSize)
  // addText(currentTree.elem.display.text, 175, 357.5)
  // addParents(currentTree, 175, 350);
}
function draw() {
  p5.background('red');
}

export async function initTreeCanvas(tree: Tree) {
  endTreeCanvas();
  container = document.getElementById("element-info-tree") as HTMLCanvasElement;
  currentTree = tree;
  p5 = new P5((p5) => {
    p5.setup = setup;
    p5.draw = draw;
  }, container);
}
export async function endTreeCanvas() {
  if (p5) {
    p5.remove();
  }
  currentTree = null;
}
