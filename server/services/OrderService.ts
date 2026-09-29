import type { Table, Order, OrderItem } from '../../src/types.ts';
import type { IOrderService } from './interfaces/IOrderService.ts';
import type { ITableRepository } from '../repositories/interfaces/ITableRepository.ts';
import type { IOrderRepository } from '../repositories/interfaces/IOrderRepository.ts';
import type { IInventoryService } from './interfaces/IInventoryService.ts';
import type { IBillingService } from './interfaces/IBillingService.ts';
import type { IPrinterConfigRepository } from '../repositories/interfaces/IPrinterConfigRepository.ts';
import type { IEventPublisher } from './interfaces/IEventNotificationService.ts';
import type { PaymentSecurityService } from '../security/PaymentSecurityService.ts';
import type { AuditLogger } from '../security/AuditLogger.ts';

/**
 * Single Responsibility: Orchestrating table operations and order lifecycle (open, add items, checkout).
 * Dependency Inversion: Receives repository and service abstractions via constructor.
 */
export class OrderService implements IOrderService {
  constructor(
    private tableRepo: ITableRepository,
    private orderRepo: IOrderRepository,
    private inventoryService: IInventoryService,
    private billingService: IBillingService,
    private printerRepo: IPrinterConfigRepository,
    private eventPublisher?: IEventPublisher,
    private paymentSecurity?: PaymentSecurityService,
    private auditLogger?: AuditLogger
  ) {}

  getAllTables(): Table[] {
    return this.tableRepo.findAll();
  }

  getTableById(id: string): Table | null {
    return this.tableRepo.findById(id);
  }

  getActiveOrders(): Record<string, Order> {
    const list = this.orderRepo.findAllActive();
    const map: Record<string, Order> = {};
    list.forEach(o => {
      map[o.id] = o;
    });
    return map;
  }

  getHistoryOrders(limit = 50): Order[] {
    const all = this.orderRepo.findAllHistory();
    return all.slice(-limit);
  }

  openTable(tableId: string, params: {
    waiterName?: string;
    customerName?: string;
    guestsCount?: number;
  }): { table: Table; order: Order } {
    const table = this.tableRepo.findById(tableId);
    if (!table) {
      throw new Error('Mesa não encontrada');
    }

    const config = this.printerRepo.getConfig();
    const orderId = `order-${Date.now()}`;
    const newOrder: Order = {
      id: orderId,
      tableId: table.id,
      tableNumber: table.number,
      tableName: table.name,
      status: 'aberta',
      items: [],
      openedAt: new Date().toISOString(),
      waiterName: params.waiterName || 'Garçom',
      customerName: params.customerName || '',
      subtotal: 0,
      serviceTaxPercent: config.defaultServiceTax || 10,
      serviceTaxAmount: 0,
      discount: 0,
      total: 0
    };

    this.orderRepo.saveActive(newOrder);

    table.status = 'ocupada';
    table.currentOrderId = orderId;
    table.waiterName = params.waiterName || 'Garçom';
    table.customerName = params.customerName || '';
    table.openedAt = newOrder.openedAt;
    table.guestsCount = params.guestsCount ? Number(params.guestsCount) : 2;
    table.total = 0;
    table.unprintedCount = 0;

    this.tableRepo.save(table);

    this.eventPublisher?.broadcast('TABLE_OPENED', { table, order: newOrder });

    return { table, order: newOrder };
  }

  addItems(tableId: string, params: {
    items: Array<{ productId: string; quantity: number; notes?: string }>;
    waiterName?: string;
  }): { table: Table; order: Order; newItems: OrderItem[] } {
    const table = this.tableRepo.findById(tableId);
    if (!table) {
      throw new Error('Mesa não encontrada');
    }

    const config = this.printerRepo.getConfig();
    let order: Order;

    // If table didn't have an active order, auto-open it
    if (!table.currentOrderId || !this.orderRepo.findActiveById(table.currentOrderId)) {
      const orderId = `order-${Date.now()}`;
      order = {
        id: orderId,
        tableId: table.id,
        tableNumber: table.number,
        tableName: table.name,
        status: 'aberta',
        items: [],
        openedAt: new Date().toISOString(),
        waiterName: params.waiterName || 'Garçom',
        customerName: '',
        subtotal: 0,
        serviceTaxPercent: config.defaultServiceTax || 10,
        serviceTaxAmount: 0,
        discount: 0,
        total: 0
      };
      this.orderRepo.saveActive(order);
      table.status = 'ocupada';
      table.currentOrderId = orderId;
      table.openedAt = order.openedAt;
      table.waiterName = params.waiterName || 'Garçom';
    } else {
      order = this.orderRepo.findActiveById(table.currentOrderId)!;
      table.status = 'ocupada';
    }

    const newOrderItems: OrderItem[] = [];

    // Deduct stock via InventoryService
    this.inventoryService.deductStockForOrder(
      params.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      { orderId: order.id, tableName: table.name }
    );

    // Build new order items
    for (const itemInput of params.items) {
      const product = this.inventoryService.getProductById(itemInput.productId);
      if (!product) continue;

      const qty = Math.max(1, Number(itemInput.quantity) || 1);
      const orderItem: OrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        costPrice: product.costPrice,
        quantity: qty,
        notes: itemInput.notes || '',
        orderedAt: new Date().toISOString(),
        waiterName: params.waiterName || order.waiterName || 'Garçom',
        printedToKitchen: false,
        category: product.category
      };

      order.items.push(orderItem);
      newOrderItems.push(orderItem);
    }

    // Calculate totals via BillingService
    this.billingService.calculateOrder(order, { taxRate: order.serviceTaxPercent });
    this.orderRepo.saveActive(order);

    // Update table stats
    table.total = order.total;
    table.unprintedCount = order.items.filter(i => !i.printedToKitchen).length;
    this.tableRepo.save(table);

    this.eventPublisher?.broadcast('ITEMS_ADDED', {
      table,
      order,
      newItems: newOrderItems,
      products: this.inventoryService.getAllProducts()
    });

    return { table, order, newItems: newOrderItems };
  }

  markItemsPrinted(tableId: string, itemIds?: string[]): { table: Table; order: Order } {
    const table = this.tableRepo.findById(tableId);
    if (!table || !table.currentOrderId) {
      throw new Error('Comanda ativa não encontrada para esta mesa');
    }

    const order = this.orderRepo.findActiveById(table.currentOrderId);
    if (!order) {
      throw new Error('Comanda ativa não encontrada');
    }

    order.items.forEach(item => {
      if (!itemIds || itemIds.includes(item.id)) {
        item.printedToKitchen = true;
      }
    });

    this.orderRepo.saveActive(order);

    table.unprintedCount = order.items.filter(i => !i.printedToKitchen).length;
    this.tableRepo.save(table);

    this.eventPublisher?.broadcast('ITEMS_PRINTED', { table, order });

    return { table, order };
  }

  requestBill(tableId: string): { table: Table; order: Order } {
    const table = this.tableRepo.findById(tableId);
    if (!table || !table.currentOrderId) {
      throw new Error('Mesa não está ocupada');
    }

    const order = this.orderRepo.findActiveById(table.currentOrderId);
    if (!order) {
      throw new Error('Comanda ativa não encontrada');
    }

    table.status = 'aguardando_conta';
    this.tableRepo.save(table);

    this.eventPublisher?.broadcast('BILL_REQUESTED', { table, order });

    return { table, order };
  }

  checkout(tableId: string, params: {
    paymentMethod?: string;
    discount?: number;
    includeServiceTax?: boolean;
    customerName?: string;
    idempotencyKey?: string;
    cardLast4?: string;
    cardBrand?: string;
  }): { table: Table; closedOrder: Order; paymentReceipt?: any } {
    // 1. Idempotency Check: Prevent duplicate charges / race conditions
    if (params.idempotencyKey && this.paymentSecurity) {
      const existing = this.paymentSecurity.getIdempotentTransaction(params.idempotencyKey);
      if (existing) {
        this.auditLogger?.log({
          type: 'PAYMENT_IDEMPOTENT_HIT',
          severity: 'info',
          details: `Requisição idempotente detectada para comanda ${existing.orderId}`
        });
        return existing.response;
      }
    }

    const table = this.tableRepo.findById(tableId);
    if (!table || !table.currentOrderId) {
      throw new Error('Mesa não possui comanda aberta');
    }

    const order = this.orderRepo.findActiveById(table.currentOrderId);
    if (!order) {
      throw new Error('Comanda ativa não encontrada');
    }

    // 2. Anti-Tampering: Validate discount parameters
    const discount = Number(params.discount) || 0;
    if (discount < 0) {
      this.auditLogger?.log({
        type: 'PAYMENT_TAMPER_DETECTED',
        severity: 'security_alert',
        details: `Tentativa de envio de desconto negativo (R$ ${discount}) para comanda #${order.id.slice(-4)}`
      });
      throw new Error('Valor de desconto não pode ser negativo');
    }
    if (discount > order.subtotal) {
      this.auditLogger?.log({
        type: 'PAYMENT_TAMPER_DETECTED',
        severity: 'security_alert',
        details: `Tentativa de envio de desconto superior ao subtotal (Desconto: R$ ${discount}, Subtotal: R$ ${order.subtotal})`
      });
      throw new Error('Desconto não pode exceder o subtotal da comanda');
    }

    const config = this.printerRepo.getConfig();
    const taxRate = params.includeServiceTax !== false ? (config.defaultServiceTax || 10) : 0;

    // Recalculate order totals via BillingService (Server-Authoritative Calculation)
    this.billingService.calculateOrder(order, { taxRate, discount });

    order.status = 'fechada';
    order.closedAt = new Date().toISOString();
    order.paymentMethod = (params.paymentMethod as any) || 'dinheiro';
    if (params.customerName) order.customerName = params.customerName;

    // 3. Payment Processing & PCI-DSS Tokenization / Central Bank PIX Record
    let paymentReceipt: any = null;
    if (params.paymentMethod === 'cartao_credito' || params.paymentMethod === 'cartao_debito') {
      if (this.paymentSecurity) {
        paymentReceipt = this.paymentSecurity.processCardPaymentToken({
          cardNumberLast4: params.cardLast4,
          brand: params.cardBrand,
          amount: order.total
        });
      }
    } else if (params.paymentMethod === 'pix') {
      if (this.paymentSecurity) {
        paymentReceipt = this.paymentSecurity.generatePixBRCode({
          pixKey: config.barCnpj || '12345678000190',
          merchantName: config.barName || 'Boteco e Bar',
          merchantCity: 'Sao Paulo',
          amount: order.total,
          txId: order.id.slice(-15)
        });
      }
    }

    // 4. Move to historical repository and delete active
    this.orderRepo.addHistory(order);
    this.orderRepo.removeActive(order.id);

    // Reset table
    table.status = 'livre';
    table.currentOrderId = undefined;
    table.openedAt = undefined;
    table.waiterName = undefined;
    table.customerName = undefined;
    table.guestsCount = undefined;
    table.total = 0;
    table.unprintedCount = 0;

    this.tableRepo.save(table);

    // 5. Security Audit Log
    this.auditLogger?.log({
      type: 'PAYMENT_AUTHORIZED',
      severity: 'info',
      details: `Pagamento de R$ ${order.total.toFixed(2)} aprovado via ${params.paymentMethod || 'dinheiro'} para mesa ${table.name}`
    });

    const result = { table, closedOrder: order, paymentReceipt };

    // 6. Save Idempotency Record
    if (params.idempotencyKey && this.paymentSecurity) {
      this.paymentSecurity.saveIdempotentTransaction(params.idempotencyKey, {
        orderId: order.id,
        amount: order.total,
        paymentMethod: order.paymentMethod,
        response: result
      });
    }

    this.eventPublisher?.broadcast('TABLE_CLOSED', { table, closedOrder: order });

    return result;
  }

  reopenOrder(orderId: string, targetTableId?: string): { table: Table; order: Order } {
    const closedOrder = this.orderRepo.findHistoryById(orderId);
    if (!closedOrder) {
      throw new Error('Comanda finalizada não encontrada no histórico');
    }

    const targetId = targetTableId || closedOrder.tableId;
    const table = this.tableRepo.findById(targetId);
    if (!table) {
      throw new Error('Mesa de destino não encontrada');
    }

    if (table.status !== 'livre' || table.currentOrderId) {
      throw new Error(`A ${table.name} está ocupada no momento. Escolha uma mesa livre para reabrir.`);
    }

    // Clone order and restore to open state
    const order: Order = {
      ...closedOrder,
      tableId: table.id,
      tableNumber: table.number,
      tableName: table.name,
      status: 'aberta',
      closedAt: undefined,
      paymentMethod: undefined
    };

    // Remove from history & place back in active orders
    this.orderRepo.removeHistory(order.id);
    this.orderRepo.saveActive(order);

    // Re-occupy target table
    table.status = 'ocupada';
    table.currentOrderId = order.id;
    table.openedAt = order.openedAt || new Date().toISOString();
    table.waiterName = order.waiterName || 'Garçom';
    table.customerName = order.customerName || '';
    table.total = order.total;
    table.unprintedCount = order.items.filter(i => !i.printedToKitchen).length;
    this.tableRepo.save(table);

    // Audit trail log
    this.auditLogger?.log({
      type: 'ORDER_REOPENED',
      severity: 'info',
      details: `Comanda #${order.id.slice(-4)} (R$ ${order.total.toFixed(2)}) reativada com sucesso na mesa ${table.name}`
    });

    // Real-time broadcast
    this.eventPublisher?.broadcast('ORDER_REOPENED', { table, order });

    return { table, order };
  }
}
