import type { Row } from "../types/Row";
import type { Col } from "../types/Col";
import type { GetCellFn } from "../types/GetCellFn";
import type { GetNeighborhoodFn } from "../types/GetNeighborhoodFn";

export const getNeighborhood = (
  getCellFn: GetCellFn,
): GetNeighborhoodFn => {
  return (cells, width, height, row, col) => {
    return {
      center: getCellFn(cells, width, height, row, col),
      north: getCellFn(cells, width, height, (row - 1) as Row, col),
      south: getCellFn(cells, width, height, (row + 1) as Row, col),
      east: getCellFn(cells, width, height, row, (col + 1) as Col),
      west: getCellFn(cells, width, height, row, (col - 1) as Col),
    };
  };
};
