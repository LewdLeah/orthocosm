import type { Neighborhood } from "./Neighborhood";
import type { CellState } from "./CellState";

export type ApplyTransitionFn = (neighborhood: Neighborhood) => CellState;
