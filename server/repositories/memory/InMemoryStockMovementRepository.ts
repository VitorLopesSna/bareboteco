import type { StockMovement } from '../../../src/types.ts';
import type { IStockMovementRepository } from '../interfaces/IStockMovementRepository.ts';

/**
 * Single Responsibility: Audit log tracking for inventory movements.
 * Liskov Substitution: Satisfies IStockMovementRepository contract.
 */
export class InMemoryStockMovementRepository implements IStockMovementRepository {
  private movements: StockMovement[] = [];

  record(movement: StockMovement): void {
    this.movements.push({ ...movement });
  }

  findAll(): StockMovement[] {
    return [...this.movements];
  }

  findByProductId(productId: string): StockMovement[] {
    return this.movements.filter(m => m.productId === productId).map(m => ({ ...m }));
  }
}
