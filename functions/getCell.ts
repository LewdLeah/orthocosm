import type { CellState } from "../types/CellState";
import type { GridWidth } from "../types/GridWidth";
import type { GridHeight } from "../types/GridHeight";
import type { Row } from "../types/Row";
import type { Col } from "../types/Col";

export const getCell = (
  cells: ReadonlyArray<CellState>,
  width: GridWidth,
  height: GridHeight,
  row: Row,
  col: Col,
): CellState => {
  const wrappedRow = ((row % height) + height) % height;
  const wrappedCol = ((col % width) + width) % width;
  return cells[wrappedRow * width + wrappedCol] as CellState;
};
