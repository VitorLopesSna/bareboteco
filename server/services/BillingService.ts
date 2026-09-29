import type { Order } from '../../src/types.ts';
import type { IBillingService } from './interfaces/IBillingService.ts';
import { BillingCalculator, StandardPercentageTaxStrategy, FixedAmountDiscountStrategy } from '../domain/strategies/PricingStrategies.ts';

/**
 * Single Responsibility: Order financial calculation (subtotal, tax, discount, total).
 * Open/Closed Principle: Employs BillingCalculator with configurable strategies.
 */
export class BillingService implements IBillingService {
  private calculator: BillingCalculator;

  constructor(calculator?: BillingCalculator) {
    this.calculator = calculator || new BillingCalculator(
      new StandardPercentageTaxStrategy(),
      new FixedAmountDiscountStrategy()
    );
  }

  calculateOrder(order: Order, options?: { taxRate?: number; discount?: number }): Order {
    return this.calculator.calculate(order, options);
  }

  recalculateWithDefaultTax(order: Order, defaultTaxPercent = 10): Order {
    const taxRate = order.serviceTaxPercent !== undefined ? order.serviceTaxPercent : defaultTaxPercent;
    return this.calculator.calculate(order, { taxRate });
  }
}
