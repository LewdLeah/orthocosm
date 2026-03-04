import type { CellState } from "./CellState";

export type Neighborhood = {
  readonly north: CellState;
  readonly south: CellState;
  readonly east: CellState;
  readonly west: CellState;
  readonly center: CellState;
};
