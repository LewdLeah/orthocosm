import type { HitPoints } from "./HitPoints";
import type { Damage } from "./Damage";
import type { IsAlive } from "./IsAlive";

export type ApplyDamageFn = (hp: HitPoints, damage: Damage, isAlive: IsAlive) => { hp: HitPoints } | {};
