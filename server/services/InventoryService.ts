import type { Product, StockMovement } from '../../src/types.ts';
import type { IInventoryService } from './interfaces/IInventoryService.ts';
import type { IProductRepository } from '../repositories/interfaces/IProductRepository.ts';
import type { IStockMovementRepository } from '../repositories/interfaces/IStockMovementRepository.ts';
import type { IEventPublisher } from './interfaces/IEventNotificationService.ts';

/**
 * Single Responsibility: Management of catalog products, stock alterations and audit movements.
 * Dependency Inversion: Injected with repository and notification abstractions.
 */
export class InventoryService implements IInventoryService {
  constructor(
    private productRepo: IProductRepository,
    private movementRepo: IStockMovementRepository,
    private eventPublisher?: IEventPublisher
  ) {}

  getAllProducts(): Product[] {
    return this.productRepo.findAll();
  }

  getProductById(id: string): Product | null {
    return this.productRepo.findById(id);
  }

  getLowStockAlerts(): Product[] {
    return this.productRepo.findLowStock();
  }

  getStockMovements(): StockMovement[] {
    return this.movementRepo.findAll();
  }

  createProduct(data: {
    name: string;
    category?: Product['category'];
    price: number;
    costPrice?: number;
    stock?: number;
    minStock?: number;
    unit?: string;
  }): Product {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: data.name,
      category: data.category || 'outros',
      price: Number(data.price),
      costPrice: Number(data.costPrice) || 0,
      stock: Number(data.stock) || 0,
      minStock: Number(data.minStock) || 5,
      unit: data.unit || 'un',
      active: true
    };

    const saved = this.productRepo.save(newProduct);

    if (saved.stock > 0) {
      const movement: StockMovement = {
        id: `sm-${Date.now()}`,
        productId: saved.id,
        productName: saved.name,
        quantityChange: saved.stock,
        previousStock: 0,
        newStock: saved.stock,
        type: 'entrada',
        reason: 'Cadastro inicial de estoque',
        timestamp: new Date().toISOString()
      };
      this.movementRepo.record(movement);
    }

    this.eventPublisher?.broadcast('PRODUCT_CREATED', { product: saved });
    return saved;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const existing = this.productRepo.findById(id);
    if (!existing) return null;

    const updated: Product = {
      ...existing,
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : existing.price,
      costPrice: updates.costPrice !== undefined ? Number(updates.costPrice) : existing.costPrice,
      stock: updates.stock !== undefined ? Number(updates.stock) : existing.stock,
      minStock: updates.minStock !== undefined ? Number(updates.minStock) : existing.minStock
    };

    const saved = this.productRepo.save(updated);
    this.eventPublisher?.broadcast('PRODUCT_UPDATED', { product: saved });
    return saved;
  }

  adjustStock(params: {
    productId: string;
    quantityChange: number;
    type?: StockMovement['type'];
    reason?: string;
  }): { product: Product; movement: StockMovement } | null {
    const product = this.productRepo.findById(params.productId);
    if (!product) return null;

    const change = Number(params.quantityChange);
    const previousStock = product.stock;
    const newStock = Math.max(0, product.stock + change);

    const updatedProduct = this.productRepo.updateStock(product.id, newStock);
    if (!updatedProduct) return null;

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      productId: updatedProduct.id,
      productName: updatedProduct.name,
      quantityChange: change,
      previousStock,
      newStock: updatedProduct.stock,
      type: params.type || 'entrada',
      reason: params.reason || 'Ajuste manual',
      timestamp: new Date().toISOString()
    };

    this.movementRepo.record(movement);
    this.eventPublisher?.broadcast('STOCK_ADJUSTED', { product: updatedProduct, movement });

    return { product: updatedProduct, movement };
  }

  deductStockForOrder(
    items: Array<{ productId: string; quantity: number }>,
    orderContext: { orderId: string; tableName: string }
  ): void {
    for (const item of items) {
      const product = this.productRepo.findById(item.productId);
      if (!product) continue;

      const qty = Math.max(1, Number(item.quantity) || 1);
      const previousStock = product.stock;
      const newStock = Math.max(0, product.stock - qty);

      const updated = this.productRepo.updateStock(product.id, newStock);
      if (!updated) continue;

      const movement: StockMovement = {
        id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: updated.id,
        productName: updated.name,
        quantityChange: -qty,
        previousStock,
        newStock: updated.stock,
        type: 'venda',
        reason: `Pedido na ${orderContext.tableName}`,
        timestamp: new Date().toISOString(),
        orderId: orderContext.orderId
      };

      this.movementRepo.record(movement);
    }
  }
}
