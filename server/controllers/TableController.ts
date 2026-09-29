import type { Request, Response } from 'express';
import type { IOrderService } from '../services/interfaces/IOrderService.ts';

/**
 * Single Responsibility: Handling HTTP endpoints for Table & Order actions.
 * Dependency Inversion: Receives IOrderService.
 */
export class TableController {
  constructor(private orderService: IOrderService) {}

  openTable = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { waiterName, customerName, guestsCount } = req.body;
      const result = this.orderService.openTable(id, { waiterName, customerName, guestsCount });
      return res.json(result);
    } catch (err: any) {
      return res.status(404).json({ error: err.message || 'Erro ao abrir mesa' });
    }
  };

  addItems = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { items, waiterName } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Nenhum item fornecido para o pedido' });
      }

      const result = this.orderService.addItems(id, { items, waiterName });
      return res.json(result);
    } catch (err: any) {
      return res.status(404).json({ error: err.message || 'Erro ao adicionar itens' });
    }
  };

  markPrinted = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { itemIds } = req.body;
      const result = this.orderService.markItemsPrinted(id, itemIds);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(404).json({ error: err.message || 'Erro ao marcar itens impressos' });
    }
  };

  requestBill = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = this.orderService.requestBill(id);
      return res.json(result);
    } catch (err: any) {
      return res.status(404).json({ error: err.message || 'Erro ao solicitar conta' });
    }
  };

  checkout = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { 
        paymentMethod, 
        discount, 
        includeServiceTax, 
        customerName,
        cardLast4,
        cardBrand
      } = req.body;

      const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body?.idempotencyKey;

      const result = this.orderService.checkout(id, {
        paymentMethod,
        discount,
        includeServiceTax,
        customerName,
        idempotencyKey,
        cardLast4,
        cardBrand
      });
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao processar fechamento' });
    }
  };

  reopenOrder = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { targetTableId } = req.body || {};
      const result = this.orderService.reopenOrder(id, targetTableId);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Erro ao reativar comanda' });
    }
  };
}
