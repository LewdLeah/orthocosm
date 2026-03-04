import type { GridWidth } from "../types/GridWidth";
import type { GridHeight } from "../types/GridHeight";
import type { CellState } from "../types/CellState";
import type { Grid } from "../types/Grid";

export const createGrid = (width: GridWidth, height: GridHeight): Grid => ({
  __state: true,
  width,
  height,
  cells: Array.from({ length: width * height }, () => 0 as CellState),
});
