import type { GameState } from "../types/GameState";
import type { Damage } from "../types/Damage";
import type { ApplyDamageFn } from "../types/ApplyDamageFn";
import type { HealOverTimeFn } from "../types/HealOverTimeFn";

export const stepCombat = (
  applyDamage: ApplyDamageFn,
  healOverTime: HealOverTimeFn,
) => (state: GameState, damage: Damage): GameState => ({
  ...state,
  ...applyDamage(state.hp, damage, state.isAlive),
  ...healOverTime(state.hp, state.regenRate),
});
