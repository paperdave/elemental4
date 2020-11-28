// NOTE: This is pretty convoluted(if that's even a word), as is haven't done TypeScript in a while
// and I kinda just improvised a solution. Cleaning up would be appreciated.
// - Bink

import { notDeepEqual } from "assert";
import { Console } from "console";
import { EPERM, SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from "constants";
import e from "express";
import { move } from "fs-extra";
import { tmpdir } from "os";
import { forEachChild } from "typescript";
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

/*
Tree like above, but it's got depth & offset, so you can draw it
and it doesn't intersect on itself. It's also top to bottom, instead
of bottom to top like the other one
*/
interface TiledTree
{
  // Itself's element (rip english)
  elem: Elem;

  // Child nodes
  children : TiledTree[];

  // Parent Node
  parent : TiledTree;

  // Position in the tilemap
  depth : number;
  offset : number;
}

// Tree stuff
let currentTree: Tree;

// 1D list of all the nodes
let nodeList : TiledTree[];

// 
let tilemap:Elem[][];

let maxDepth : number = 0;
let maxOffset : number = 0;
let minOffset : number = 0;

// Now that I think of it, there's no tile maps involved lmao
function drawTileMap(){
  let tileWidth = tilemap.length;
  let tileHeight = tilemap[0].length;


}


// Possible Improvements: Turn this into code that doesn't look like C
function getTreeToTiles(rtree : TiledTree)
{
  console.log("Finished Tiled Tree:",rtree)
  console.log("Limits for tree are");
  console.log(maxDepth,",",minOffset,":",maxOffset)

  var result : Elem[][] = [[]];

  {// There's most likely a function that does that for me
    let row : Elem[] = [];

    for(let i = 0; i < maxDepth + 1; i++)
    {
      row.push(null);
    }

    result[0] = row;

    for(let i = 0; i < Math.abs(minOffset) + maxOffset + 1; i++)
    {
      // The slice, is to make a copy of the values, instead of a reference to the array
      result.push(row.slice());
    }
  }

  for (let node of nodeList)
  {
    result[node.depth][node.offset + (Math.abs(minOffset))] = node.elem;
  }

  tilemap = result;

  console.log(tilemap)
}

function nodeIntersects(node : TiledTree)
{
  let dir : number = 0;

  for(let e of nodeList)
  {
    if(e.depth == node.depth && e.offset == node.offset && e.parent != node.parent)
    {
      console.log("Found intersecting node at [",node.depth,",",node.offset,"]");
      console.log("Direction is ",dir);

      if(e.parent.offset > node.parent.offset)
      {
        dir = -1;
      }
      else if(e.parent.offset < node.parent.offset)
      {
        dir = 1;
      }
      else
      {
        // Not too sure what to do then lmao
        dir = 1;
      }

      dir = -e.offset;

      console.log(e.parent.offset, "<=>", node.parent.offset)
      
      break;
    }
  }

  return dir;
}

// Recursively moves the nodes
function moveNode(node : TiledTree, distance : number) 
{
  node.offset += distance;

  for(let e of node.children)
  {
    moveNode(e,distance);
  }
}

// Creates the spaces in the tree, so no nodes intersect
function spaceTree(rtree : TiledTree)
{
  for(let e of rtree.children)
  {
    // Dir is for direction, of where it should move
    let dir = nodeIntersects(e);

    if(dir != 0)
    {
      moveNode(e.parent,dir);
    }
  }
}

// Turns the given tree, into a Tiled Tree,
// The tiled tree, is also a bottom to top tree, instead of 
// a top to bottom tree, like the base tree
// (recursivity gang)
function makeTiledTree(tree : Tree, d : number, o : number, p : TiledTree)
{
  // weird variable name
  var result : TiledTree = {
    elem: tree.elem,
    children: [] = [], // works ?!?!
    parent: p,
    depth: d,
    offset: o
  };

  // Probably a better way than if statements
  if(d > maxDepth){
    maxDepth = d;
  }if(o > maxOffset){
    maxOffset = o;
  }if(o < minOffset){
    minOffset = o;
  }

  if(tree.parent1 != null)
  {
  //  console.log("Ain't null");
    // janky
    let tmp : TiledTree = makeTiledTree(tree.parent1,d + 1,o + 1,result);

    if (tmp != null)
    {
      tmp.offset += 1;
      nodeList.push(tmp);
      result.children.push(tmp);
    }
  }

  if(tree.parent2 != null)
  {
    // double janky
    let tmp : TiledTree = makeTiledTree(tree.parent2,d + 1,o - 1,result);

    if(tmp != null)
    {
      tmp.offset -= -1;
      nodeList.push(tmp);
      result.children.push(tmp);
    }
  }

  if(tree.parent1 != null && tree.parent2 == null)
  {
    result.children[0].offset = o;
  }

  return result;
}

function update() {
  if(!canvasRunning) {
    return;
  }
  
  ctx.fillStyle = '#999999';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawTileMap();

  requestAnimationFrame(update);
}

export async function initTreeCanvas(tree: Tree) {
  currentTree = tree;
  nodeList = []
  maxDepth = 0;
  minOffset = 0;
  maxOffset = 0;
  tilemap = null;

  canvas = document.getElementById("element-info-tree") as HTMLCanvasElement;
  ctx = canvas.getContext("2d");
  canvas.width = 350;
  canvas.height = 400;

  // Don't forget to remove that
  console.log("Initing the Tree Canvas");

  console.log("Original Tree:",currentTree)
  
  let rtree = makeTiledTree(currentTree,0,0,null);
  console.log("Tiled Tree tree:",rtree);
  console.log("Node list", nodeList);
  spaceTree(rtree);
  getTreeToTiles(rtree);

  update();
}
export async function endTreeCanvas() {
  canvasRunning = false;
  currentTree = null;
}
