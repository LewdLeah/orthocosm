import type { CellState } from "../types/CellState";
import type { GridWidth } from "../types/GridWidth";
import type { GridHeight } from "../types/GridHeight";

export const renderGrid = (
  cells: ReadonlyArray<CellState>,
  width: GridWidth,
  height: GridHeight,
): string => {
  const symbols = [` `, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`];
  const lines: string[] = [];
  for (let r = 0; r < height; r++) {
    const row: string[] = [];
    for (let c = 0; c < width; c++) {
      const cell = cells[r * width + c] as CellState;
      row.push(symbols[cell] ?? `?`);
    }
    lines.push(row.join(``));
  }
  return lines.join(`\n`);
};
