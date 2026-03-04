import type { CellState } from "./CellState";
import type { GridWidth } from "./GridWidth";
import type { GridHeight } from "./GridHeight";
import type { Row } from "./Row";
import type { Col } from "./Col";
import type { Neighborhood } from "./Neighborhood";

export type GetNeighborhoodFn = (
  cells: ReadonlyArray<CellState>,
  width: GridWidth,
  height: GridHeight,
  row: Row,
  col: Col,
) => Neighborhood;
