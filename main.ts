import { stepCombat } from "./steps/stepCombat";
import { applyDamage } from "./functions/applyDamage";
import { healOverTime } from "./functions/healOverTime";

stepCombat(applyDamage, healOverTime);
