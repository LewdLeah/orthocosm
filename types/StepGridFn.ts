import type { CellState } from "./CellState";
import type { GridWidth } from "./GridWidth";
import type { GridHeight } from "./GridHeight";

export type StepGridFn = (
  cells: ReadonlyArray<CellState>,
  width: GridWidth,
  height: GridHeight,
) => { readonly cells: ReadonlyArray<CellState> };
