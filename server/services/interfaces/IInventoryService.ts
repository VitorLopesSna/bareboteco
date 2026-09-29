import type { Product, StockMovement } from '../../../src/types.ts';

export interface IInventoryService {
  getAllProducts(): Product[];
  getProductById(id: string): Product | null;
  getLowStockAlerts(): Product[];
  getStockMovements(): StockMovement[];
  
  createProduct(data: {
    name: string;
    category?: Product['category'];
    price: number;
    costPrice?: number;
    stock?: number;
    minStock?: number;
    unit?: string;
  }): Product;

  updateProduct(id: string, updates: Partial<Product>): Product | null;

  adjustStock(params: {
    productId: string;
    quantityChange: number;
    type?: StockMovement['type'];
    reason?: string;
  }): { product: Product; movement: StockMovement } | null;

  deductStockForOrder(
    items: Array<{ productId: string; quantity: number }>,
    orderContext: { orderId: string; tableName: string }
  ): void;
}
