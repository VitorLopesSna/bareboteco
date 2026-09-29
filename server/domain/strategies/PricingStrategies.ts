import type { Order } from '../../../src/types.ts';

/**
 * Open/Closed Principle (OCP) & Strategy Pattern:
 * Tax calculation is open for extension (e.g. VIP exempt, happy hour special tax, fixed tax)
 * without modifying the billing service.
 */
export interface IServiceTaxStrategy {
  calculateTax(subtotal: number, ratePercent: number): number;
}

export class StandardPercentageTaxStrategy implements IServiceTaxStrategy {
  calculateTax(subtotal: number, ratePercent: number): number {
    if (ratePercent <= 0 || subtotal <= 0) return 0;
    return Number(((subtotal * ratePercent) / 100).toFixed(2));
  }
}

export class ExemptTaxStrategy implements IServiceTaxStrategy {
  calculateTax(_subtotal: number, _ratePercent: number): number {
    return 0;
  }
}

/**
 * Open/Closed Principle (OCP):
 * Discount calculations are isolated strategies.
 */
export interface IDiscountStrategy {
  calculateDiscount(subtotal: number, inputValue: number): number;
}

export class FixedAmountDiscountStrategy implements IDiscountStrategy {
  calculateDiscount(subtotal: number, fixedAmount: number): number {
    const validDiscount = Math.max(0, fixedAmount || 0);
    return Math.min(subtotal, Number(validDiscount.toFixed(2)));
  }
}

export class PercentageDiscountStrategy implements IDiscountStrategy {
  calculateDiscount(subtotal: number, percentage: number): number {
    if (percentage <= 0 || subtotal <= 0) return 0;
    const discount = (subtotal * percentage) / 100;
    return Math.min(subtotal, Number(discount.toFixed(2)));
  }
}

export class ZeroDiscountStrategy implements IDiscountStrategy {
  calculateDiscount(_subtotal: number, _value: number): number {
    return 0;
  }
}

/**
 * Single Responsibility: Orchestrating billing and order calculation using injected strategies.
 * Dependency Inversion: Depends on IServiceTaxStrategy and IDiscountStrategy abstractions.
 */
export class BillingCalculator {
  constructor(
    private taxStrategy: IServiceTaxStrategy = new StandardPercentageTaxStrategy(),
    private discountStrategy: IDiscountStrategy = new FixedAmountDiscountStrategy()
  ) {}

  calculate(order: Order, options?: { taxRate?: number; discount?: number }): Order {
    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const taxRate = options?.taxRate !== undefined ? options.taxRate : (order.serviceTaxPercent ?? 10);
    const rawDiscount = options?.discount !== undefined ? options.discount : (order.discount ?? 0);

    const discountAmount = this.discountStrategy.calculateDiscount(subtotal, rawDiscount);
    const taxAmount = this.taxStrategy.calculateTax(subtotal, taxRate);
    const total = Math.max(0, Number((subtotal + taxAmount - discountAmount).toFixed(2)));

    order.subtotal = Number(subtotal.toFixed(2));
    order.serviceTaxPercent = taxRate;
    order.serviceTaxAmount = taxAmount;
    order.discount = discountAmount;
    order.total = total;

    return order;
  }
}
