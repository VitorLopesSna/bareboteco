import type { Order } from '../../../src/types.ts';

/**
 * Interface Segregation Principle (ISP):
 * Segregating active open orders from historical closed orders.
 */
export interface IActiveOrderRepository {
  findActiveById(id: string): Order | null;
  findActiveByTableId(tableId: string): Order | null;
  findAllActive(): Order[];
  saveActive(order: Order): Order;
  removeActive(id: string): boolean;
}

export interface IHistoricalOrderRepository {
  findHistoryById(id: string): Order | null;
  findAllHistory(): Order[];
  addHistory(order: Order): void;
  removeHistory(id: string): boolean;
}

export interface IOrderRepository extends IActiveOrderRepository, IHistoricalOrderRepository {}
