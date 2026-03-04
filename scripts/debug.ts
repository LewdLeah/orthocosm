// Quick debug: run a few generations and print diffs
import { createGrid } from "../functions/createGrid";
import { seedLoop } from "../functions/seedLoop";
import { stepGrid } from "../functions/stepGrid";
import { renderGrid } from "../functions/renderGrid";
import { getCell } from "../functions/getCell";
import { getNeighborhood } from "../functions/getNeighborhood";
import { makeTransitionKey } from "../functions/makeTransitionKey";
import { applyTransition } from "../functions/applyTransition";
import { buildTransitionTable } from "../functions/buildTransitionTable";
import { evoloopsRules } from "../data/evoloopsRules";
import type { GridWidth } from "../types/GridWidth";
import type { GridHeight } from "../types/GridHeight";
import type { Row } from "../types/Row";
import type { Col } from "../types/Col";
import type { Grid } from "../types/Grid";

const width = 80 as GridWidth;
const height = 40 as GridHeight;

const empty = createGrid(width, height);
const seeded = seedLoop(empty.cells, width, height, 5 as Row, 5 as Col);
let grid: Grid = { __state: true, width, height, cells: seeded.cells };

const neighborhoodFn = getNeighborhood(getCell);
const table = buildTransitionTable(evoloopsRules);
const transitionFn = applyTransition(makeTransitionKey, table);
const step = stepGrid(neighborhoodFn, transitionFn);

let prevRender = ``;
let stuckCount = 0;

for (let gen = 0; gen <= 300; gen++) {
  const rendered = renderGrid(grid.cells, width, height);
  if (rendered === prevRender) {
    stuckCount++;
    if (stuckCount === 1) {
      console.log(`Stuck starting at generation ${gen}`);
    }
  } else {
    if (stuckCount > 0) {
      console.log(`Was stuck for ${stuckCount} generations`);
      stuckCount = 0;
    }
    if (gen <= 10 || gen % 50 === 0) {
      console.log(`\nGeneration ${gen}:`);
      // Print only non-empty lines
      const lines = rendered.split(`\n`);
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().length > 0) {
          console.log(`${String(i).padStart(2)}: ${lines[i]}`);
        }
      }
    }
  }
  prevRender = rendered;
  const result = step(grid.cells, width, height);
  grid = { ...grid, cells: result.cells };
}

if (stuckCount > 0) {
  console.log(`Still stuck after 300 generations (stuck for ${stuckCount} gens)`);
}

// Check rule table stats
console.log(`\nRule table size: ${table.size}`);
