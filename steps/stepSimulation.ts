import type { Grid } from "../types/Grid";
import type { StepGridFn } from "../types/StepGridFn";

export const stepSimulation = (
  stepGridFn: StepGridFn,
) => {
  return (state: Grid): Grid => ({
    ...state,
    ...stepGridFn(state.cells, state.width, state.height),
  });
};
