import type { HitPoints } from "../types/HitPoints";
import type { RegenRate } from "../types/RegenRate";

export const healOverTime = (hp: HitPoints, regenRate: RegenRate) =>
  ({ hp: (hp + regenRate) as HitPoints });
