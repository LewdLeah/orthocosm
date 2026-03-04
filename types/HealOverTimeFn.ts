import type { HitPoints } from "./HitPoints";
import type { RegenRate } from "./RegenRate";

export type HealOverTimeFn = (hp: HitPoints, regenRate: RegenRate) => { hp: HitPoints };
