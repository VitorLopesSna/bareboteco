import type { Order, PrinterConfig } from '../../types.ts';
import type { IReceiptFormatter, ReceiptFormatOptions, PaperWidth } from './IReceiptFormatter.ts';

abstract class BaseReceiptFormatter implements IReceiptFormatter {
  abstract getTitle(): string;
  abstract formatBody(order: Order, width: PaperWidth, divider: string, doubleDivider: string): string;

  format(order: Order, config: PrinterConfig, options?: ReceiptFormatOptions): string {
    const width = options?.paperWidth || config.paperWidth || '80mm';
    const dividerChar = width === '58mm' ? '--------------------------------' : '------------------------------------------------';
    const doubleDivider = width === '58mm' ? '================================' : '================================================';
    const nowStr = (options?.now || new Date()).toLocaleString('pt-BR');

    let txt = '';
    txt += `${config.barName || 'BOTECO & BAR'}\n`;
    if (config.barAddress) txt += `${config.barAddress}\n`;
    if (config.barPhone) txt += `Tel: ${config.barPhone}\n`;
    if (config.barCnpj) txt += `CNPJ: ${config.barCnpj}\n`;
    txt += `${dividerChar}\n`;

    txt += `${this.getTitle()}\n`;
    txt += `MESA: ${order.tableName}   ORDEM: #${order.id.slice(-4)}\n`;
    txt += `DATA: ${nowStr}\n`;
    if (order.waiterName) txt += `GARCOM: ${order.waiterName}\n`;
    if (order.customerName) txt += `CLIENTE: ${order.customerName}\n`;
    txt += `${dividerChar}\n`;

    txt += this.formatBody(order, width, dividerChar, doubleDivider);

    txt += `${dividerChar}\n`;
    if (config.footerMessage) {
      txt += `${config.footerMessage}\n`;
    }
    txt += `[Corte aqui / Papel Termico]\n\n\n`;

    return txt;
  }
}

/**
 * Single Responsibility: Formats kitchen/bar preparation tickets.
 */
export class KitchenReceiptFormatter extends BaseReceiptFormatter {
  getTitle(): string {
    return '*** PEDIDO COZINHA / BAR ***';
  }

  formatBody(order: Order, width: PaperWidth, divider: string): string {
    const items = order.items.some(i => !i.printedToKitchen) 
      ? order.items.filter(i => !i.printedToKitchen) 
      : order.items;

    let txt = width === '58mm' 
      ? `QTD ITEM                   OBS\n` 
      : `QTD  DESCRICAO                      OBSERVACAO\n`;
    txt += `${divider}\n`;

    items.forEach(item => {
      const nameCut = width === '58mm' 
        ? (item.name.length > 20 ? item.name.substring(0, 20) : item.name.padEnd(20))
        : (item.name.length > 24 ? item.name.substring(0, 24) : item.name.padEnd(24));

      txt += `${String(item.quantity).padStart(2)}x ${nameCut}\n`;
      if (item.notes) {
        txt += `   >> OBS: ${item.notes}\n`;
      }
    });

    txt += `${divider}\n`;
    txt += `TOTAL DE ITENS: ${items.reduce((acc, i) => acc + i.quantity, 0)}\n`;
    return txt;
  }
}

/**
 * Single Responsibility: Formats pre-checkout table bill conferences.
 */
export class BillReceiptFormatter extends BaseReceiptFormatter {
  getTitle(): string {
    return '*** CONFERENCIA DE MESA ***';
  }

  formatBody(order: Order, width: PaperWidth, divider: string, doubleDivider: string): string {
    let txt = width === '58mm' 
      ? `QTD ITEM                   VALOR\n` 
      : `QTD  DESCRICAO                      UNIT    TOTAL\n`;
    txt += `${divider}\n`;

    order.items.forEach(item => {
      const lineTotal = (item.price * item.quantity).toFixed(2);
      if (width === '58mm') {
        const nameCut = item.name.length > 20 ? item.name.substring(0, 20) : item.name.padEnd(20);
        txt += `${item.quantity}x ${nameCut} R$${lineTotal}\n`;
      } else {
        const nameCut = item.name.length > 24 ? item.name.substring(0, 24) : item.name.padEnd(24);
        txt += `${String(item.quantity).padStart(2)}x  ${nameCut}  R$${item.price.toFixed(2)}  R$${lineTotal}\n`;
      }
      if (item.notes) {
        txt += `   >> OBS: ${item.notes}\n`;
      }
    });

    txt += `${divider}\n`;
    txt += `Subtotal:                R$ ${order.subtotal.toFixed(2)}\n`;
    if (order.serviceTaxAmount > 0) {
      txt += `Servico (${order.serviceTaxPercent}%):           R$ ${order.serviceTaxAmount.toFixed(2)}\n`;
    }
    if (order.discount && order.discount > 0) {
      txt += `Desconto:              - R$ ${order.discount.toFixed(2)}\n`;
    }
    txt += `${doubleDivider}\n`;
    txt += `TOTAL A PAGAR:           R$ ${order.total.toFixed(2)}\n`;
    return txt;
  }
}

/**
 * Single Responsibility: Formats final payment receipt with payment method details.
 */
export class PaymentReceiptFormatter extends BaseReceiptFormatter {
  getTitle(): string {
    return '*** COMPROVANTE DE PAGAMENTO ***';
  }

  formatBody(order: Order, width: PaperWidth, divider: string, doubleDivider: string): string {
    let txt = width === '58mm' 
      ? `QTD ITEM                   VALOR\n` 
      : `QTD  DESCRICAO                      UNIT    TOTAL\n`;
    txt += `${divider}\n`;

    order.items.forEach(item => {
      const lineTotal = (item.price * item.quantity).toFixed(2);
      if (width === '58mm') {
        const nameCut = item.name.length > 20 ? item.name.substring(0, 20) : item.name.padEnd(20);
        txt += `${item.quantity}x ${nameCut} R$${lineTotal}\n`;
      } else {
        const nameCut = item.name.length > 24 ? item.name.substring(0, 24) : item.name.padEnd(24);
        txt += `${String(item.quantity).padStart(2)}x  ${nameCut}  R$${item.price.toFixed(2)}  R$${lineTotal}\n`;
      }
      if (item.notes) {
        txt += `   >> OBS: ${item.notes}\n`;
      }
    });

    txt += `${divider}\n`;
    txt += `Subtotal:                R$ ${order.subtotal.toFixed(2)}\n`;
    if (order.serviceTaxAmount > 0) {
      txt += `Servico (${order.serviceTaxPercent}%):           R$ ${order.serviceTaxAmount.toFixed(2)}\n`;
    }
    if (order.discount && order.discount > 0) {
      txt += `Desconto:              - R$ ${order.discount.toFixed(2)}\n`;
    }
    txt += `${doubleDivider}\n`;
    txt += `TOTAL PAGO:              R$ ${order.total.toFixed(2)}\n`;

    if (order.paymentMethod) {
      const methodNames: Record<string, string> = {
        dinheiro: 'Dinheiro',
        pix: 'PIX',
        cartao_credito: 'Cartao de Credito',
        cartao_debito: 'Cartao de Debito',
        misto: 'Misto'
      };
      txt += `FORMA PAGTO: ${methodNames[order.paymentMethod] || order.paymentMethod.toUpperCase()}\n`;
    }
    return txt;
  }
}

/**
 * Open/Closed Principle (OCP) Factory:
 * Extensible registry where new formatters can be added without modifying consumer components.
 */
export class ReceiptFormatterRegistry {
  private static formatters: Map<string, IReceiptFormatter> = new Map([
    ['kitchen', new KitchenReceiptFormatter()],
    ['bill', new BillReceiptFormatter()],
    ['payment_receipt', new PaymentReceiptFormatter()]
  ]);

  static register(type: string, formatter: IReceiptFormatter): void {
    this.formatters.set(type, formatter);
  }

  static get(type: 'kitchen' | 'bill' | 'payment_receipt' | string): IReceiptFormatter {
    const formatter = this.formatters.get(type);
    if (!formatter) {
      return this.formatters.get('bill')!;
    }
    return formatter;
  }
}
