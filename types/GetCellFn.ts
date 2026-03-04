import type { CellState } from "./CellState";
import type { GridWidth } from "./GridWidth";
import type { GridHeight } from "./GridHeight";
import type { Row } from "./Row";
import type { Col } from "./Col";

export type GetCellFn = (
  cells: ReadonlyArray<CellState>,
  width: GridWidth,
  height: GridHeight,
  row: Row,
  col: Col,
) => CellState;
