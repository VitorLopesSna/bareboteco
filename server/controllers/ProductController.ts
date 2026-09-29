import type { Request, Response } from 'express';
import type { IInventoryService } from '../services/interfaces/IInventoryService.ts';

/**
 * Single Responsibility: Handling HTTP endpoints for Catalog and Inventory Management.
 * Dependency Inversion: Receives IInventoryService.
 */
export class ProductController {
  constructor(private inventoryService: IInventoryService) {}

  createProduct = (req: Request, res: Response) => {
    const { name, category, price, costPrice, stock, minStock, unit } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }

    const created = this.inventoryService.createProduct({
      name,
      category,
      price: Number(price),
      costPrice: costPrice !== undefined ? Number(costPrice) : undefined,
      stock: stock !== undefined ? Number(stock) : undefined,
      minStock: minStock !== undefined ? Number(minStock) : undefined,
      unit
    });

    return res.status(201).json(created);
  };

  updateProduct = (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = this.inventoryService.updateProduct(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    return res.json(updated);
  };

  adjustStock = (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantityChange, type, reason } = req.body;
    if (quantityChange === undefined) {
      return res.status(400).json({ error: 'Quantidade de alteração é obrigatória' });
    }

    const result = this.inventoryService.adjustStock({
      productId: id,
      quantityChange: Number(quantityChange),
      type,
      reason
    });

    if (!result) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    return res.json(result);
  };
}
