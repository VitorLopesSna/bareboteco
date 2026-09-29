import type { Order, PrinterConfig } from '../../types.ts';

export type PaperWidth = '58mm' | '80mm';

export interface ReceiptFormatOptions {
  paperWidth?: PaperWidth;
  now?: Date;
}

/**
 * Open/Closed Principle (OCP) & Liskov Substitution Principle (LSP):
 * Any receipt formatter can format an order and printer configuration into formatted text.
 */
export interface IReceiptFormatter {
  format(order: Order, config: PrinterConfig, options?: ReceiptFormatOptions): string;
}
