import type { StockMovement } from '../../../src/types.ts';

export interface IStockMovementRepository {
  record(movement: StockMovement): void;
  findAll(): StockMovement[];
  findByProductId(productId: string): StockMovement[];
}
