import type { Product } from '../../../src/types.ts';
import type { IProductRepository } from '../interfaces/IProductRepository.ts';

/**
 * Single Responsibility: In-memory persistence and query for Product entities.
 * Liskov Substitution: Satisfies IProductRepository contract.
 */
export class InMemoryProductRepository implements IProductRepository {
  private products: Product[];

  constructor(initialProducts: Product[]) {
    this.products = [...initialProducts];
  }

  findById(id: string): Product | null {
    const p = this.products.find(item => item.id === id);
    return p ? { ...p } : null;
  }

  findAll(): Product[] {
    return this.products.map(p => ({ ...p }));
  }

  findLowStock(): Product[] {
    return this.products.filter(p => p.active && p.stock <= p.minStock).map(p => ({ ...p }));
  }

  save(product: Product): Product {
    const index = this.products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      this.products[index] = { ...product };
    } else {
      this.products.push({ ...product });
    }
    return { ...product };
  }

  updateStock(productId: string, newStock: number): Product | null {
    const index = this.products.findIndex(p => p.id === productId);
    if (index === -1) return null;
    this.products[index].stock = Math.max(0, newStock);
    return { ...this.products[index] };
  }

  delete(id: string): boolean {
    const initialLen = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    return this.products.length < initialLen;
  }
}
