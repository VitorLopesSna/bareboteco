import type { SalesReport } from '../../src/types.ts';
import type { IReportService } from './interfaces/IReportService.ts';
import type { IOrderRepository } from '../repositories/interfaces/IOrderRepository.ts';
import type { IProductRepository } from '../repositories/interfaces/IProductRepository.ts';

/**
 * Single Responsibility: Sales analytics, revenue/cost aggregation, and financial reports.
 * Dependency Inversion: Injected with repository abstractions.
 */
export class ReportService implements IReportService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository
  ) {}

  generateSalesReport(): SalesReport {
    const historyOrders = this.orderRepo.findAllHistory();
    const totalRevenue = historyOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    let totalCost = 0;
    const productSalesCount: Record<string, { name: string; quantity: number; amount: number }> = {};
    const paymentsBreakdown: Record<string, number> = {
      dinheiro: 0,
      pix: 0,
      cartao_credito: 0,
      cartao_debito: 0
    };

    historyOrders.forEach(order => {
      if (order.paymentMethod && paymentsBreakdown[order.paymentMethod] !== undefined) {
        paymentsBreakdown[order.paymentMethod] += order.total;
      }
      order.items.forEach(item => {
        totalCost += (item.costPrice || 0) * item.quantity;
        if (!productSalesCount[item.productId]) {
          productSalesCount[item.productId] = { name: item.name, quantity: 0, amount: 0 };
        }
        productSalesCount[item.productId].quantity += item.quantity;
        productSalesCount[item.productId].amount += item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productSalesCount)
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantity: data.quantity,
        totalAmount: data.amount
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const lowStockAlerts = this.productRepo.findLowStock();

    return {
      period: 'Hoje',
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      grossProfit: Number((totalRevenue - totalCost).toFixed(2)),
      totalOrders: historyOrders.length,
      averageTicket: historyOrders.length > 0 ? Number((totalRevenue / historyOrders.length).toFixed(2)) : 0,
      paymentsBreakdown,
      topProducts,
      lowStockAlerts
    };
  }
}
