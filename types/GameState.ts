import type { HitPoints } from "./HitPoints";
import type { RegenRate } from "./RegenRate";
import type { IsAlive } from "./IsAlive";

export type GameState = {
  readonly __state: true;
  hp: HitPoints;
  regenRate: RegenRate;
  isAlive: IsAlive;
};
