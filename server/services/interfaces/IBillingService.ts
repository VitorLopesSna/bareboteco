import type { Order } from '../../../src/types.ts';

export interface IBillingService {
  calculateOrder(order: Order, options?: { taxRate?: number; discount?: number }): Order;
  recalculateWithDefaultTax(order: Order, defaultTaxPercent?: number): Order;
}
