import type { HitPoints } from "../types/HitPoints";
import type { Damage } from "../types/Damage";
import type { IsAlive } from "../types/IsAlive";

export const applyDamage = (hp: HitPoints, damage: Damage, isAlive: IsAlive) =>
  isAlive ? { hp: (hp - damage) as HitPoints } : {};
