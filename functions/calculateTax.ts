import type { Amount } from "../types/Amount";
import type { TaxRate } from "../types/TaxRate";

export const calculateTax = (amount: Amount, taxRate: TaxRate) => {
  return amount * taxRate;
};
