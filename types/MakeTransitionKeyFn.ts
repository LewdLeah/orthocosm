import type { Neighborhood } from "./Neighborhood";
import type { TransitionKey } from "./TransitionKey";

export type MakeTransitionKeyFn = (n: Neighborhood) => TransitionKey;
