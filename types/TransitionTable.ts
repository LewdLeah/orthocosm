import type { CellState } from "./CellState";
import type { TransitionKey } from "./TransitionKey";

export type TransitionTable = ReadonlyMap<TransitionKey, CellState>;
