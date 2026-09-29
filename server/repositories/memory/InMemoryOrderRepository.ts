import type { Order } from '../../../src/types.ts';
import type { IOrderRepository } from '../interfaces/IOrderRepository.ts';

/**
 * Single Responsibility: Storage and retrieval of active and historical orders.
 * Liskov Substitution: Satisfies IOrderRepository contract.
 */
export class InMemoryOrderRepository implements IOrderRepository {
  private activeOrders: Map<string, Order> = new Map();
  private historyOrders: Order[] = [];

  constructor(initialActive: Record<string, Order> = {}, initialHistory: Order[] = []) {
    Object.entries(initialActive).forEach(([id, order]) => {
      this.activeOrders.set(id, { ...order, items: [...order.items] });
    });
    this.historyOrders = initialHistory.map(o => ({ ...o, items: [...o.items] }));
  }

  findActiveById(id: string): Order | null {
    const order = this.activeOrders.get(id);
    return order ? { ...order, items: [...order.items] } : null;
  }

  findActiveByTableId(tableId: string): Order | null {
    for (const order of this.activeOrders.values()) {
      if (order.tableId === tableId) {
        return { ...order, items: [...order.items] };
      }
    }
    return null;
  }

  findAllActive(): Order[] {
    return Array.from(this.activeOrders.values()).map(o => ({ ...o, items: [...o.items] }));
  }

  saveActive(order: Order): Order {
    const cloned = { ...order, items: [...order.items] };
    this.activeOrders.set(order.id, cloned);
    return cloned;
  }

  removeActive(id: string): boolean {
    return this.activeOrders.delete(id);
  }

  findHistoryById(id: string): Order | null {
    const order = this.historyOrders.find(o => o.id === id);
    return order ? { ...order, items: [...order.items] } : null;
  }

  findAllHistory(): Order[] {
    return this.historyOrders.map(o => ({ ...o, items: [...o.items] }));
  }

  addHistory(order: Order): void {
    this.historyOrders.push({ ...order, items: [...order.items] });
  }

  removeHistory(id: string): boolean {
    const idx = this.historyOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.historyOrders.splice(idx, 1);
      return true;
    }
    return false;
  }
}
