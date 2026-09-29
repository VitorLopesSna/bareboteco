import type { Product } from '../../../src/types.ts';
import type { IRepository } from './IRepository.ts';

export interface IProductRepository extends IRepository<Product, string> {
  findLowStock(): Product[];
  updateStock(productId: string, newStock: number): Product | null;
}
