import type { CellState } from "../types/CellState";
import type { GridWidth } from "../types/GridWidth";
import type { GridHeight } from "../types/GridHeight";
import type { Row } from "../types/Row";
import type { Col } from "../types/Col";

export const seedLoop = (
  cells: ReadonlyArray<CellState>,
  width: GridWidth,
  height: GridHeight,
  startRow: Row,
  startCol: Col,
): { readonly cells: ReadonlyArray<CellState> } => {
  const pattern = [
    `022222222000000`,
    `217014014200000`,
    `202222220200000`,
    `272000021200000`,
    `212000021200000`,
    `202000021200000`,
    `272000021200000`,
    `212222221222220`,
    `207107107111170`,
    `022222222222220`,
  ];

  const nextCells = [...cells];
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      const gridRow = startRow + r;
      const gridCol = startCol + c;
      if (gridRow < height && gridCol < width) {
        nextCells[gridRow * width + gridCol] = Number(pattern[r][c]) as CellState;
      }
    }
  }

  return { cells: nextCells };
};
