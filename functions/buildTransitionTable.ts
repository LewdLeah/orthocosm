import type { TransitionTable } from "../types/TransitionTable";
import type { TransitionKey } from "../types/TransitionKey";
import type { CellState } from "../types/CellState";

export const buildTransitionTable = (
  rules: ReadonlyArray<readonly [ReadonlyArray<number>, number]>,
): TransitionTable => {
  const map = new Map<TransitionKey, CellState>();
  for (const [pattern, result] of rules) {
    const [c, n, e, s, w] = pattern;
    const rotations = [
      [c, n, e, s, w],
      [c, w, n, e, s],
      [c, s, w, n, e],
      [c, e, s, w, n],
    ];
    for (const rot of rotations) {
      const key = rot.join(`,`) as TransitionKey;
      if (!map.has(key)) {
        map.set(key, result as CellState);
      }
    }
  }
  return map;
};
