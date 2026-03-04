import { runLoop } from "./runtime/simulationLoop";
import { stepSimulation } from "./steps/stepSimulation";
import { renderSimulation } from "./steps/renderSimulation";
import { stepGrid } from "./functions/stepGrid";
import { renderGrid } from "./functions/renderGrid";
import { getCell } from "./functions/getCell";
import { getNeighborhood } from "./functions/getNeighborhood";
import { makeTransitionKey } from "./functions/makeTransitionKey";
import { applyTransition } from "./functions/applyTransition";
import { buildTransitionTable } from "./functions/buildTransitionTable";
import { initializeGrid } from "./functions/initializeGrid";
import { createGrid } from "./functions/createGrid";
import { seedLoop } from "./functions/seedLoop";
import { evoloopsRules } from "./data/evoloopsRules";
import type { GridWidth } from "./types/GridWidth";
import type { GridHeight } from "./types/GridHeight";
import type { Row } from "./types/Row";
import type { Col } from "./types/Col";

runLoop(
  stepSimulation(
    stepGrid(
      getNeighborhood(getCell),
      applyTransition(makeTransitionKey, buildTransitionTable(evoloopsRules)),
    ),
  ),
  renderSimulation(renderGrid),
  initializeGrid(createGrid, seedLoop, 80 as GridWidth, 40 as GridHeight, 5 as Row, 5 as Col),
  1000,
  100,
)();
