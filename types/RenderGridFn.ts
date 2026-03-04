import type { CellState } from "./CellState";
import type { GridWidth } from "./GridWidth";
import type { GridHeight } from "./GridHeight";

export type RenderGridFn = (
  cells: ReadonlyArray<CellState>,
  width: GridWidth,
  height: GridHeight,
) => string;
