import { Elem } from "../../shared/elem";
import { getAPI } from "./api";

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

let canvasRunning = true;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let currentTree: Tree;

function update() {
  if(!canvasRunning) {
    return;
  }
  
  ctx.fillStyle = '#999999';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  requestAnimationFrame(update);
}
export async function initTreeCanvas(tree: Tree) {
  currentTree = tree;
  canvas = document.getElementById("element-info-tree") as HTMLCanvasElement;
  ctx = canvas.getContext("2d");
  canvas.width = 350;
  canvas.height = 400;
  update();
}
export async function endTreeCanvas() {
  canvasRunning = false;
  currentTree = null;
}
