import type { CellState } from "../types/CellState";
import type { GridWidth } from "../types/GridWidth";
import type { GridHeight } from "../types/GridHeight";
import type { Row } from "../types/Row";
import type { Col } from "../types/Col";

export const initializeGrid = (
  createGridFn: (width: GridWidth, height: GridHeight) => { readonly cells: ReadonlyArray<CellState>; readonly width: GridWidth; readonly height: GridHeight },
  seedLoopFn: (cells: ReadonlyArray<CellState>, width: GridWidth, height: GridHeight, startRow: Row, startCol: Col) => { readonly cells: ReadonlyArray<CellState> },
  width: GridWidth,
  height: GridHeight,
  startRow: Row,
  startCol: Col,
) => {
  const empty = createGridFn(width, height);
  const seeded = seedLoopFn(empty.cells, width, height, startRow, startCol);
  return { __state: true as const, width, height, cells: seeded.cells };
};
