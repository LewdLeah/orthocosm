// Find cells that default (no matching rule) with the pre-expanded table
import { createGrid } from "../functions/createGrid";
import { seedLoop } from "../functions/seedLoop";
import { getCell } from "../functions/getCell";
import { getNeighborhood } from "../functions/getNeighborhood";
import { makeTransitionKey } from "../functions/makeTransitionKey";
import { buildTransitionTable } from "../functions/buildTransitionTable";
import { stepGrid } from "../functions/stepGrid";
import { applyTransition } from "../functions/applyTransition";
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

const getCellFn = getCell;
const neighborhoodFn = getNeighborhood(getCellFn);
const table = buildTransitionTable(evoloopsRules);
const transitionFn = applyTransition(makeTransitionKey, table);
const step = stepGrid(neighborhoodFn, transitionFn);

console.log(`Table size: ${table.size}`);

for (let gen = 0; gen <= 30; gen++) {
  const unmatched: string[] = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const cell = getCellFn(grid.cells, width, height, r as Row, c as Col);
      if (cell === 0) continue;
      const n = neighborhoodFn(grid.cells, width, height, r as Row, c as Col);
      const key = makeTransitionKey(n);
      if (!table.has(key)) {
        unmatched.push(`(${r},${c}) C=${n.center} N=${n.north} E=${n.east} S=${n.south} W=${n.west} key=${key}`);
      }
    }
  }
  if (unmatched.length > 0) {
    console.log(`\nGen ${gen}: ${unmatched.length} unmatched cells (defaulting to 0)`);
    for (const u of unmatched) {
      console.log(`  ${u}`);
    }
  }
  const result = step(grid.cells, width, height);
  grid = { ...grid, cells: result.cells };
}
