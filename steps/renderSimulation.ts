import type { Grid } from "../types/Grid";
import type { RenderGridFn } from "../types/RenderGridFn";

export const renderSimulation = (
  renderGridFn: RenderGridFn,
) => {
  return (state: Grid): string => {
    return renderGridFn(state.cells, state.width, state.height);
  };
};
