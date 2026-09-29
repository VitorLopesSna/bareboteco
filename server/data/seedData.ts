import type { Product, Table, PrinterConfig, Order, OrderItem } from '../../src/types.ts';

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Chopp Brahma 300ml',
    category: 'cervejas',
    price: 9.00,
    costPrice: 3.20,
    stock: 120,
    minStock: 30,
    unit: 'un',
    active: true
  },
  {
    id: 'prod-2',
    name: 'Chopp Brahma 500ml',
    category: 'cervejas',
    price: 14.00,
    costPrice: 5.00,
    stock: 85,
    minStock: 25,
    unit: 'un',
    active: true
  },
  {
    id: 'prod-3',
    name: 'Heineken Long Neck 330ml',
    category: 'cervejas',
    price: 12.00,
    costPrice: 5.50,
    stock: 48,
    minStock: 24,
    unit: 'garrafa',
    active: true
  },
  {
    id: 'prod-4',
    name: 'Cerveja Original 600ml',
    category: 'cervejas',
    price: 16.50,
    costPrice: 7.80,
    stock: 36,
    minStock: 20,
    unit: 'garrafa',
    active: true
  },
  {
    id: 'prod-5',
    name: 'Corona Extra 330ml',
    category: 'cervejas',
    price: 13.00,
    costPrice: 6.00,
    stock: 7,
    minStock: 15,
    unit: 'garrafa',
    active: true
  },
  {
    id: 'prod-6',
    name: 'Caipirinha de Cachaça Tradicional',
    category: 'drinks',
    price: 22.00,
    costPrice: 6.00,
    stock: 50,
    minStock: 15,
    unit: 'un',
    active: true
  },
  {
    id: 'prod-7',
    name: 'Caipivodka Frutas Vermelhas',
    category: 'drinks',
    price: 26.00,
    costPrice: 8.50,
    stock: 40,
    minStock: 12,
    unit: 'un',
    active: true
  },
  {
    id: 'prod-8',
    name: 'Gin Tônica Tropical Tanqueray',
    category: 'drinks',
    price: 29.00,
    costPrice: 9.50,
    stock: 32,
    minStock: 10,
    unit: 'un',
    active: true
  },
  {
    id: 'prod-9',
    name: 'Dose Cachaça Salinas Ouro',
    category: 'doses',
    price: 10.00,
    costPrice: 2.80,
    stock: 28,
    minStock: 8,
    unit: 'dose',
    active: true
  },
  {
    id: 'prod-10',
    name: 'Dose Whisky Red Label',
    category: 'doses',
    price: 18.00,
    costPrice: 6.50,
    stock: 22,
    minStock: 6,
    unit: 'dose',
    active: true
  },
  {
    id: 'prod-11',
    name: 'Coca-Cola Lata 350ml',
    category: 'sem_alcool',
    price: 7.00,
    costPrice: 2.80,
    stock: 65,
    minStock: 20,
    unit: 'lata',
    active: true
  },
  {
    id: 'prod-12',
    name: 'Guaraná Antarctica Lata 350ml',
    category: 'sem_alcool',
    price: 7.00,
    costPrice: 2.80,
    stock: 50,
    minStock: 20,
    unit: 'lata',
    active: true
  },
  {
    id: 'prod-13',
    name: 'Água Mineral com Gás 500ml',
    category: 'sem_alcool',
    price: 5.50,
    costPrice: 1.50,
    stock: 45,
    minStock: 15,
    unit: 'garrafa',
    active: true
  },
  {
    id: 'prod-14',
    name: 'Batata Frita Especial (Cheddar & Bacon)',
    category: 'porcoes',
    price: 38.00,
    costPrice: 12.00,
    stock: 26,
    minStock: 10,
    unit: 'porção',
    active: true
  },
  {
    id: 'prod-15',
    name: 'Frango a Passarinho c/ Alho Torrado',
    category: 'porcoes',
    price: 44.00,
    costPrice: 15.00,
    stock: 19,
    minStock: 8,
    unit: 'porção',
    active: true
  },
  {
    id: 'prod-16',
    name: 'Calabresa Acebolada com Cesta de Pão',
    category: 'porcoes',
    price: 39.00,
    costPrice: 13.00,
    stock: 16,
    minStock: 8,
    unit: 'porção',
    active: true
  },
  {
    id: 'prod-17',
    name: 'Pastéis Mistos Boteco (6 unidades)',
    category: 'porcoes',
    price: 34.00,
    costPrice: 11.00,
    stock: 22,
    minStock: 10,
    unit: 'porção',
    active: true
  },
  {
    id: 'prod-18',
    name: 'Sanduíche de Pernil na Ciabatta',
    category: 'lanches',
    price: 27.00,
    costPrice: 9.00,
    stock: 15,
    minStock: 5,
    unit: 'un',
    active: true
  }
];

export const initialPrinterConfig: PrinterConfig = {
  paperWidth: '80mm',
  barName: 'BOTECO & BAR DO ZE',
  barAddress: 'Rua Augusta, 1420 - Consolação, SP',
  barPhone: '(11) 98765-4321',
  barCnpj: '12.345.678/0001-90',
  footerMessage: 'Obrigado pela preferência! Volte sempre!',
  autoPrintKitchen: true,
  includeServiceTaxInCheck: true,
  defaultServiceTax: 10,
  fontSize: 'normal'
};

export function createInitialSeedState(): {
  tables: Table[];
  activeOrders: Record<string, Order>;
  historyOrders: Order[];
} {
  const tables: Table[] = Array.from({ length: 12 }, (_, i) => {
    const num = i + 1;
    return {
      id: `table-${num}`,
      number: num,
      name: `Mesa ${String(num).padStart(2, '0')}`,
      status: 'livre',
      total: 0,
      unprintedCount: 0
    };
  });

  const activeOrders: Record<string, Order> = {};
  const historyOrders: Order[] = [];
  const now = new Date();

  // Seed Mesa 01 (ocupada)
  const order1Id = 'order-seed-1';
  const item1: OrderItem = {
    id: 'item-101',
    productId: 'prod-1',
    name: 'Chopp Brahma 300ml',
    price: 9.00,
    costPrice: 3.20,
    quantity: 2,
    orderedAt: new Date(now.getTime() - 45 * 60000).toISOString(),
    waiterName: 'Carlos (Garçom)',
    printedToKitchen: true,
    category: 'cervejas'
  };
  const item2: OrderItem = {
    id: 'item-102',
    productId: 'prod-14',
    name: 'Batata Frita Especial (Cheddar & Bacon)',
    price: 38.00,
    costPrice: 12.00,
    quantity: 1,
    notes: 'Bacon bem crocante',
    orderedAt: new Date(now.getTime() - 40 * 60000).toISOString(),
    waiterName: 'Carlos (Garçom)',
    printedToKitchen: true,
    category: 'porcoes'
  };
  const subtotal1 = 2 * 9.00 + 38.00;
  const tax1 = Number((subtotal1 * 0.1).toFixed(2));
  activeOrders[order1Id] = {
    id: order1Id,
    tableId: 'table-1',
    tableNumber: 1,
    tableName: 'Mesa 01',
    status: 'aberta',
    items: [item1, item2],
    openedAt: new Date(now.getTime() - 50 * 60000).toISOString(),
    waiterName: 'Carlos (Garçom)',
    customerName: 'Roberto Silva',
    subtotal: subtotal1,
    serviceTaxPercent: 10,
    serviceTaxAmount: tax1,
    discount: 0,
    total: subtotal1 + tax1
  };
  tables[0].status = 'ocupada';
  tables[0].currentOrderId = order1Id;
  tables[0].waiterName = 'Carlos (Garçom)';
  tables[0].customerName = 'Roberto Silva';
  tables[0].openedAt = activeOrders[order1Id].openedAt;
  tables[0].total = activeOrders[order1Id].total;
  tables[0].unprintedCount = 0;

  // Seed Mesa 03 (aguardando_conta)
  const order3Id = 'order-seed-3';
  const item3: OrderItem = {
    id: 'item-301',
    productId: 'prod-3',
    name: 'Heineken Long Neck 330ml',
    price: 12.00,
    costPrice: 5.50,
    quantity: 3,
    orderedAt: new Date(now.getTime() - 80 * 60000).toISOString(),
    waiterName: 'Mariana (Garçom)',
    printedToKitchen: true,
    category: 'cervejas'
  };
  const item4: OrderItem = {
    id: 'item-302',
    productId: 'prod-16',
    name: 'Calabresa Acebolada com Cesta de Pão',
    price: 39.00,
    costPrice: 13.00,
    quantity: 1,
    orderedAt: new Date(now.getTime() - 75 * 60000).toISOString(),
    waiterName: 'Mariana (Garçom)',
    printedToKitchen: true,
    category: 'porcoes'
  };
  const subtotal3 = 3 * 12.00 + 39.00;
  const tax3 = Number((subtotal3 * 0.1).toFixed(2));
  activeOrders[order3Id] = {
    id: order3Id,
    tableId: 'table-3',
    tableNumber: 3,
    tableName: 'Mesa 03',
    status: 'aberta',
    items: [item3, item4],
    openedAt: new Date(now.getTime() - 85 * 60000).toISOString(),
    waiterName: 'Mariana (Garçom)',
    customerName: 'Família Souza',
    subtotal: subtotal3,
    serviceTaxPercent: 10,
    serviceTaxAmount: tax3,
    discount: 0,
    total: subtotal3 + tax3
  };
  tables[2].status = 'aguardando_conta';
  tables[2].currentOrderId = order3Id;
  tables[2].waiterName = 'Mariana (Garçom)';
  tables[2].customerName = 'Família Souza';
  tables[2].openedAt = activeOrders[order3Id].openedAt;
  tables[2].total = activeOrders[order3Id].total;
  tables[2].unprintedCount = 0;

  // Past closed orders for reports
  historyOrders.push(
    {
      id: 'hist-1',
      tableId: 'table-5',
      tableNumber: 5,
      tableName: 'Mesa 05',
      status: 'fechada',
      items: [
        {
          id: 'hitem-1',
          productId: 'prod-1',
          name: 'Chopp Brahma 300ml',
          price: 9.00,
          costPrice: 3.20,
          quantity: 4,
          orderedAt: new Date(now.getTime() - 180 * 60000).toISOString(),
          waiterName: 'Carlos (Garçom)',
          printedToKitchen: true
        },
        {
          id: 'hitem-2',
          productId: 'prod-17',
          name: 'Pastéis Mistos Boteco (6 unidades)',
          price: 34.00,
          costPrice: 11.00,
          quantity: 1,
          orderedAt: new Date(now.getTime() - 170 * 60000).toISOString(),
          waiterName: 'Carlos (Garçom)',
          printedToKitchen: true
        }
      ],
      openedAt: new Date(now.getTime() - 190 * 60000).toISOString(),
      closedAt: new Date(now.getTime() - 120 * 60000).toISOString(),
      waiterName: 'Carlos (Garçom)',
      customerName: 'André Santos',
      subtotal: 70.00,
      serviceTaxPercent: 10,
      serviceTaxAmount: 7.00,
      discount: 0,
      total: 77.00,
      paymentMethod: 'pix'
    },
    {
      id: 'hist-2',
      tableId: 'table-2',
      tableNumber: 2,
      tableName: 'Mesa 02',
      status: 'fechada',
      items: [
        {
          id: 'hitem-3',
          productId: 'prod-6',
          name: 'Caipirinha de Cachaça Tradicional',
          price: 22.00,
          costPrice: 6.00,
          quantity: 2,
          orderedAt: new Date(now.getTime() - 240 * 60000).toISOString(),
          waiterName: 'Mariana (Garçom)',
          printedToKitchen: true
        },
        {
          id: 'hitem-4',
          productId: 'prod-15',
          name: 'Frango a Passarinho c/ Alho Torrado',
          price: 44.00,
          costPrice: 15.00,
          quantity: 1,
          orderedAt: new Date(now.getTime() - 230 * 60000).toISOString(),
          waiterName: 'Mariana (Garçom)',
          printedToKitchen: true
        }
      ],
      openedAt: new Date(now.getTime() - 250 * 60000).toISOString(),
      closedAt: new Date(now.getTime() - 160 * 60000).toISOString(),
      waiterName: 'Mariana (Garçom)',
      customerName: 'Beatriz Lima',
      subtotal: 88.00,
      serviceTaxPercent: 10,
      serviceTaxAmount: 8.80,
      discount: 0,
      total: 96.80,
      paymentMethod: 'cartao_credito'
    }
  );

  return { tables, activeOrders, historyOrders };
}
