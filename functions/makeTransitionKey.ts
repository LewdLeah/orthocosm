import type { Neighborhood } from "../types/Neighborhood";
import type { TransitionKey } from "../types/TransitionKey";

export const makeTransitionKey = (n: Neighborhood): TransitionKey =>
  `${n.center},${n.north},${n.east},${n.south},${n.west}` as TransitionKey;
