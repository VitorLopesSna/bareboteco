export type TableStatus = 'livre' | 'ocupada' | 'aguardando_conta';

export type UserRole = 'admin' | 'caixa' | 'garcom';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type ProductCategory = 
  | 'cervejas'
  | 'drinks'
  | 'doses'
  | 'sem_alcool'
  | 'porcoes'
  | 'lanches'
  | 'sobremesas'
  | 'outros';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string; // 'un', 'lata', 'garrafa', 'dose', 'porção'
  barcode?: string;
  active: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  notes?: string;
  orderedAt: string;
  waiterName: string;
  printedToKitchen: boolean;
  category?: ProductCategory;
}

export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  tableName: string;
  status: 'aberta' | 'fechada' | 'cancelada';
  items: OrderItem[];
  openedAt: string;
  closedAt?: string;
  waiterName: string;
  customerName?: string;
  subtotal: number;
  serviceTaxPercent: number; // usually 10
  serviceTaxAmount: number;
  discount: number;
  total: number;
  paymentMethod?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'misto';
  notes?: string;
}

export interface Table {
  id: string;
  number: number;
  name: string;
  capacity?: number;
  status: TableStatus;
  currentOrderId?: string;
  openedAt?: string;
  waiterName?: string;
  customerName?: string;
  guestsCount?: number;
  total?: number;
  unprintedCount?: number;
  updatedAt?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  type: 'venda' | 'entrada' | 'ajuste' | 'perda';
  reason: string;
  timestamp: string;
  orderId?: string;
}

export interface PrinterConfig {
  paperWidth: '58mm' | '80mm';
  barName: string;
  barAddress: string;
  barPhone: string;
  barCnpj: string;
  footerMessage: string;
  autoPrintKitchen: boolean;
  includeServiceTaxInCheck: boolean;
  defaultServiceTax: number;
  fontSize: 'normal' | 'large';
}

export interface SalesReport {
  period: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  totalOrders: number;
  averageTicket: number;
  paymentsBreakdown: Record<string, number>;
  topProducts: {
    productId: string;
    productName: string;
    quantity: number;
    totalAmount: number;
  }[];
  lowStockAlerts: Product[];
}
