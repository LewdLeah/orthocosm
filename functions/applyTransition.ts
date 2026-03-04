import type { CellState } from "../types/CellState";
import type { TransitionTable } from "../types/TransitionTable";
import type { MakeTransitionKeyFn } from "../types/MakeTransitionKeyFn";
import type { ApplyTransitionFn } from "../types/ApplyTransitionFn";

export const applyTransition = (
  makeKey: MakeTransitionKeyFn,
  table: TransitionTable,
): ApplyTransitionFn => {
  return (neighborhood) => {
    const key = makeKey(neighborhood);
    const result = table.get(key);
    return result !== undefined ? result : 0 as CellState;
  };
};
