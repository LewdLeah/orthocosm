import type { CellState } from "../types/CellState";
import type { GridWidth } from "../types/GridWidth";
import type { GridHeight } from "../types/GridHeight";
import type { Row } from "../types/Row";
import type { Col } from "../types/Col";
import type { ApplyTransitionFn } from "../types/ApplyTransitionFn";
import type { GetNeighborhoodFn } from "../types/GetNeighborhoodFn";
import type { StepGridFn } from "../types/StepGridFn";

export const stepGrid = (
  getNeighborhoodFn: GetNeighborhoodFn,
  applyTransitionFn: ApplyTransitionFn,
): StepGridFn => {
  return (cells, width, height) => {
    const nextCells: CellState[] = [];
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const neighborhood = getNeighborhoodFn(cells, width, height, r as Row, c as Col);
        nextCells.push(applyTransitionFn(neighborhood));
      }
    }
    return { cells: nextCells };
  };
};
