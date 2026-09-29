import type { Table, Order, OrderItem } from '../../../src/types.ts';

export interface IOrderService {
  getAllTables(): Table[];
  getTableById(id: string): Table | null;
  getActiveOrders(): Record<string, Order>;
  getHistoryOrders(limit?: number): Order[];

  openTable(tableId: string, params: {
    waiterName?: string;
    customerName?: string;
    guestsCount?: number;
  }): { table: Table; order: Order };

  addItems(tableId: string, params: {
    items: Array<{ productId: string; quantity: number; notes?: string }>;
    waiterName?: string;
  }): { table: Table; order: Order; newItems: OrderItem[] };

  markItemsPrinted(tableId: string, itemIds?: string[]): { table: Table; order: Order };

  requestBill(tableId: string): { table: Table; order: Order };

  checkout(tableId: string, params: {
    paymentMethod?: string;
    discount?: number;
    includeServiceTax?: boolean;
    customerName?: string;
    idempotencyKey?: string;
    cardLast4?: string;
    cardBrand?: string;
  }): { table: Table; closedOrder: Order; paymentReceipt?: any };

  reopenOrder(orderId: string, targetTableId?: string): { table: Table; order: Order };
}
