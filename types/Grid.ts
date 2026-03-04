import type { CellState } from "./CellState";
import type { GridWidth } from "./GridWidth";
import type { GridHeight } from "./GridHeight";

export type Grid = {
  readonly __state: true;
  readonly width: GridWidth;
  readonly height: GridHeight;
  readonly cells: ReadonlyArray<CellState>;
};
