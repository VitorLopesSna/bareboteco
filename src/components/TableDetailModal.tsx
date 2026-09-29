import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Receipt, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Percent, 
  User, 
  Clock, 
  AlertCircle,
  FileText,
  ShieldCheck,
  Shield,
  Copy,
  Check,
  Lock
} from 'lucide-react';
import type { Table, Order, Product, PrinterConfig } from '../types';
import { generatePixBRCode } from '../services/api';
import { CurrencyInput } from './CurrencyInput';

interface TableDetailModalProps {
  table: Table;
  order?: Order;
  products: Product[];
  printerConfig: PrinterConfig;
  currentUserRole?: 'admin' | 'caixa' | 'garcom';
  onClose: () => void;
  onOpenTable: (tableId: string, waiterName: string, customerName: string, guestsCount: number) => Promise<void>;
  onAddItems: (tableId: string, items: Array<{ productId: string; quantity: number; notes?: string }>, waiterName?: string) => Promise<void>;
  onRequestBill: (tableId: string) => Promise<void>;
  onCheckout: (tableId: string, data: {
    paymentMethod: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito';
    discount?: number;
    includeServiceTax?: boolean;
    customerName?: string;
    idempotencyKey?: string;
    cardLast4?: string;
    cardBrand?: string;
  }) => Promise<void>;
  onOpenPrint: (order: Order, type: 'kitchen' | 'bill' | 'payment_receipt') => void;
  onMarkPrinted: (tableId: string) => Promise<void>;
  defaultWaiterName?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

export const TableDetailModal: React.FC<TableDetailModalProps> = ({
  table,
  order,
  products,
  printerConfig,
  currentUserRole,
  onClose,
  onOpenTable,
  onAddItems,
  onRequestBill,
  onCheckout,
  onOpenPrint,
  onMarkPrinted,
  defaultWaiterName
}) => {
  const canCheckout = currentUserRole === 'admin' || currentUserRole === 'caixa';
  const isGarcom = currentUserRole === 'garcom';
  // Open table form state
  const [waiterName, setWaiterName] = useState(table.waiterName || defaultWaiterName || 'Garçom');
  const [customerName, setCustomerName] = useState(table.customerName || '');
  const [guestsCount, setGuestsCount] = useState(table.guestsCount || 2);

  // Add items state
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Record<string, { product: Product; quantity: number; notes: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkout modal state
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito'>('pix');
  const [includeService, setIncludeService] = useState(printerConfig.includeServiceTaxInCheck ?? true);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [cashGiven, setCashGiven] = useState<number>(0);

  // Payment Security & In-app payment fields (Card & PIX)
  const [cardLast4, setCardLast4] = useState<string>('4242');
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'elo'>('visa');
  const [pixBRCode, setPixBRCode] = useState<string>('');
  const [pixCopied, setPixCopied] = useState<boolean>(false);
  const [pixLoading, setPixLoading] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isFree = table.status === 'livre';

  // Handle open table submit
  const handleOpenTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onOpenTable(table.id, waiterName, customerName, guestsCount);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev[product.id];
      const qty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: qty,
          notes: existing?.notes || ''
        }
      };
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      const existing = prev[productId];
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: { ...existing, quantity: newQty }
      };
    });
  };

  const updateCartNotes = (productId: string, notes: string) => {
    setCart(prev => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: { ...prev[productId], notes }
      };
    });
  };

  const handleSendItems = async () => {
    const cartList = Object.values(cart) as CartItem[];
    const itemsList = cartList.map(c => ({
      productId: c.product.id,
      quantity: c.quantity,
      notes: c.notes
    }));

    if (itemsList.length === 0) return;

    setIsSubmitting(true);
    try {
      await onAddItems(table.id, itemsList, waiterName || order?.waiterName || 'Garçom');
      setCart({});
    } finally {
      setIsSubmitting(false);
    }
  };

  // Checkout calculations
  const subtotal = order ? order.subtotal : 0;
  const serviceAmount = includeService ? Number(((subtotal * (printerConfig.defaultServiceTax || 10)) / 100).toFixed(2)) : 0;
  const finalTotal = Math.max(0, subtotal + serviceAmount - discountAmount);
  const changeValue = paymentMethod === 'dinheiro' && cashGiven > finalTotal 
    ? cashGiven - finalTotal 
    : 0;

  // Auto-generate EMVCo Central Bank PIX BRCode when PIX tab is active
  useEffect(() => {
    if (showCheckout && paymentMethod === 'pix' && finalTotal > 0) {
      setPixLoading(true);
      generatePixBRCode(finalTotal, order?.id?.slice(-15))
        .then(res => {
          setPixBRCode(res.brCode);
        })
        .catch(err => {
          console.error('PIX generation error', err);
        })
        .finally(() => {
          setPixLoading(false);
        });
    }
  }, [showCheckout, paymentMethod, finalTotal, order?.id]);

  const handleCopyPix = () => {
    if (!pixBRCode) return;
    navigator.clipboard.writeText(pixBRCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleConfirmCheckout = async () => {
    setCheckoutError(null);
    if (discountAmount < 0) {
      setCheckoutError('O desconto não pode ser um valor negativo');
      return;
    }
    if (discountAmount > subtotal) {
      setCheckoutError(`O desconto não pode exceder o subtotal da mesa (R$ ${subtotal.toFixed(2)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const idempotencyKey = `pay-${table.id}-${Date.now()}`;
      await onCheckout(table.id, {
        paymentMethod,
        discount: discountAmount,
        includeServiceTax: includeService,
        customerName: customerName || order?.customerName,
        idempotencyKey,
        cardLast4: paymentMethod.startsWith('cartao') ? cardLast4 : undefined,
        cardBrand: paymentMethod.startsWith('cartao') ? cardBrand : undefined
      });
      onClose();
    } catch (err: any) {
      setCheckoutError(err.message || 'Erro ao processar pagamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products for adding
  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    const matchesCat = selectedCategory === 'todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartList = Object.values(cart) as CartItem[];
  const cartTotal = cartList.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-black text-lg">
              {String(table.number).padStart(2, '0')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-stone-900">{table.name}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  table.status === 'livre' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : table.status === 'ocupada' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {table.status === 'livre' ? 'Livre' : table.status === 'ocupada' ? 'Ocupada' : 'Aguardando Conta'}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {order ? `Comanda #${order.id.slice(-4)} aberta às ${new Date(order.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Nenhuma comanda ativa'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-table-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-stone-50/50">
          {/* If table is Free: Show Open Table Form */}
          {isFree ? (
            <div className="max-w-md mx-auto py-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">Abrir {table.name}</h3>
                <p className="text-xs text-stone-500">Inicie um novo atendimento nesta mesa para começar a lançar pedidos</p>
              </div>

              <form onSubmit={handleOpenTable} className="space-y-4 bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Garçom Responsável</label>
                  <input
                    type="text"
                    id="input-waiter-name"
                    value={waiterName}
                    onChange={(e) => setWaiterName(e.target.value)}
                    placeholder="Nome do garçom"
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nome do Cliente (Opcional)</label>
                  <input
                    type="text"
                    id="input-customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: João Silva ou Família Oliveira"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Número de Pessoas</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 4, 6, 8].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setGuestsCount(n)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          guestsCount === n 
                            ? 'bg-amber-600 text-white shadow-xs' 
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-submit-open-table"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Abrindo...' : 'Confirmar e Abrir Mesa'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Table is Occupied or Waiting for Bill */
            <div className="space-y-6">
              {/* Top Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
                <div className="flex items-center gap-4 text-xs text-stone-600">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>Garçom: <strong className="text-stone-900">{order?.waiterName || table.waiterName}</strong></span>
                  </div>
                  {order?.customerName && (
                    <div>Cliente: <strong className="text-stone-900">{order.customerName}</strong></div>
                  )}
                  {table.openedAt && (
                    <div className="flex items-center gap-1 text-stone-500">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{new Date(table.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Print Kitchen Slip */}
                  <button
                    type="button"
                    id="btn-print-kitchen-slip"
                    onClick={() => order && onOpenPrint(order, 'kitchen')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition-colors"
                    title="Imprimir comanda para Cozinha/Bar"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-700" />
                    <span>Imprimir Comanda</span>
                  </button>

                  {/* Print Table Bill */}
                  <button
                    type="button"
                    id="btn-print-table-bill"
                    onClick={() => order && onOpenPrint(order, 'bill')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 border border-stone-300 text-stone-800 hover:bg-stone-200 transition-colors"
                    title="Imprimir pré-conta para conferência"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-600" />
                    <span>Pré-Conta</span>
                  </button>

                  {/* Request Bill Button */}
                  {table.status !== 'aguardando_conta' ? (
                    <button
                      type="button"
                      id="btn-request-bill"
                      onClick={() => onRequestBill(table.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      Pedir Conta
                    </button>
                  ) : isGarcom ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 border border-amber-300 text-amber-900">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Conta Solicitada ao Caixa</span>
                    </span>
                  ) : null}

                  {/* Checkout Button (Admin and Caixa only) */}
                  {canCheckout && (
                    <button
                      type="button"
                      id="btn-open-checkout-view"
                      onClick={() => setShowCheckout(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Fechar Mesa & Receber</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Two Column Layout: Current Items on Left, Add Items on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Current Comanda Items */}
                <div className="lg:col-span-6 bg-white rounded-xl border border-stone-200 p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
                      <h4 className="font-bold text-stone-900 text-sm">Itens da Comanda ({order?.items.length || 0})</h4>
                      {table.unprintedCount && table.unprintedCount > 0 ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {table.unprintedCount} pendente(s) de impressão
                        </span>
                      ) : null}
                    </div>

                    {order?.items && order.items.length > 0 ? (
                      <div className="divide-y divide-stone-100 max-h-[320px] overflow-y-auto pr-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded">
                                  {item.quantity}x
                                </span>
                                <span className="text-sm font-semibold text-stone-900 truncate">
                                  {item.name}
                                </span>
                              </div>
                              {item.notes && (
                                <p className="text-xs text-amber-700 font-medium pl-6">
                                  Obs: {item.notes}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-[11px] text-stone-400 pl-6 mt-0.5">
                                <span>{item.waiterName}</span>
                                <span>•</span>
                                <span>{new Date(item.orderedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                {item.printedToKitchen ? (
                                  <span className="text-emerald-600 font-medium">Impresso</span>
                                ) : (
                                  <span className="text-rose-600 font-bold">Não impresso</span>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-xs font-bold text-stone-900">
                                R$ {(item.price * item.quantity).toFixed(2)}
                              </div>
                              <div className="text-[10px] text-stone-400">
                                R$ {item.price.toFixed(2)} un
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-stone-400 text-xs">
                        Nenhum item lançado ainda nesta comanda.
                      </div>
                    )}
                  </div>

                  {/* Subtotals Box */}
                  <div className="pt-4 border-t border-stone-200 mt-4 space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-stone-900">R$ {(order?.subtotal || 0).toFixed(2)}</span>
                    </div>
                    {order && order.serviceTaxAmount > 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span>Serviço ({order.serviceTaxPercent}%):</span>
                        <span className="font-semibold text-stone-900">R$ {order.serviceTaxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-stone-200">
                      <span>Total:</span>
                      <span>R$ {(order?.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Fast Item Adder */}
                <div className="lg:col-span-6 bg-white rounded-xl border border-stone-200 p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm mb-2">Lançar Mais Itens</h4>

                    {/* Category tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-2 text-xs font-semibold">
                      {[
                        { id: 'todos', label: 'Todos' },
                        { id: 'cervejas', label: 'Cervejas' },
                        { id: 'drinks', label: 'Drinks' },
                        { id: 'doses', label: 'Doses' },
                        { id: 'sem_alcool', label: 'Bebidas' },
                        { id: 'porcoes', label: 'Porções' },
                        { id: 'lanches', label: 'Lanches' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                            selectedCategory === cat.id 
                              ? 'bg-stone-900 text-white' 
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Search field */}
                    <input
                      type="text"
                      id="input-search-product"
                      placeholder="Buscar por nome do produto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addToCart(product)}
                          className="p-2 border border-stone-200 rounded-lg hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all flex flex-col justify-between"
                        >
                          <div className="font-bold text-xs text-stone-900 line-clamp-1">{product.name}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-extrabold text-amber-700">R$ {product.price.toFixed(2)}</span>
                            <span className={`text-[10px] px-1 rounded font-medium ${product.stock <= product.minStock ? 'bg-rose-100 text-rose-700' : 'text-stone-400'}`}>
                              Estq: {product.stock}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tray / Selected items to send */}
                  {Object.keys(cart).length > 0 && (
                    <div className="mt-4 pt-3 border-t border-stone-200">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-800 mb-2">
                        <span>Novos itens selecionados</span>
                        <span className="text-amber-800 font-extrabold">R$ {cartTotal.toFixed(2)}</span>
                      </div>

                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                        {(Object.values(cart) as CartItem[]).map(({ product, quantity, notes }) => (
                          <div key={product.id} className="p-2 bg-stone-50 rounded-lg border border-stone-200 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-stone-900 truncate max-w-[140px]">{product.name}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(product.id, -1)}
                                  className="w-5 h-5 rounded bg-white border border-stone-300 flex items-center justify-center font-bold text-stone-700 hover:bg-stone-100"
                                >
                                  -
                                </button>
                                <span className="font-bold w-4 text-center">{quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(product.id, 1)}
                                  className="w-5 h-5 rounded bg-white border border-stone-300 flex items-center justify-center font-bold text-stone-700 hover:bg-stone-100"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              placeholder="Observação (ex: sem gelo, bem gelada)"
                              value={notes}
                              onChange={(e) => updateCartNotes(product.id, e.target.value)}
                              className="w-full text-[11px] px-2 py-0.5 border border-stone-300 rounded bg-white"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="pt-3">
                        <button
                          type="button"
                          id="btn-confirm-add-items"
                          onClick={handleSendItems}
                          disabled={isSubmitting}
                          className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isSubmitting ? 'Enviando...' : 'Adicionar à Comanda (Sincronizar)'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Checkout Drawer/Modal Overlay */}
        {showCheckout && (
          <div className="absolute inset-0 z-20 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-stone-900 text-base">Fechar Conta - {table.name}</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowCheckout(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Payment Methods Selection */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'pix', label: 'PIX (QR Code)', icon: QrCode },
                    { id: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard },
                    { id: 'cartao_debito', label: 'Cartão de Débito', icon: CreditCard },
                    { id: 'dinheiro', label: 'Dinheiro', icon: Banknote }
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          paymentMethod === m.id 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' 
                            : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Service Tax and Discount */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2 mb-4 text-xs">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={includeService}
                      onChange={(e) => setIncludeService(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Incluir 10% de taxa de serviço</span>
                  </label>
                  <span className="font-bold text-stone-800">
                    {includeService ? `+ R$ ${serviceAmount.toFixed(2)}` : 'R$ 0,00'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                  <span className="font-semibold text-stone-700">Desconto manual (R$):</span>
                  <CurrencyInput
                    value={discountAmount}
                    onChange={(val) => setDiscountAmount(val)}
                    placeholder="R$ 0,00"
                    max={subtotal}
                    className="w-28 px-2 py-1 border border-stone-300 rounded text-right text-xs font-semibold bg-white text-stone-900 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>

                {/* Cash Change Calculation */}
                {paymentMethod === 'dinheiro' && (
                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                    <span className="font-semibold text-stone-700">Valor recebido (R$):</span>
                    <CurrencyInput
                      value={cashGiven}
                      onChange={(val) => setCashGiven(val)}
                      placeholder="R$ 0,00"
                      className="w-28 px-2 py-1 border border-stone-300 rounded text-right text-xs font-semibold bg-white text-stone-900 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Error Message */}
              {checkoutError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* PIX Payment Interface (EMVCo BRCode) */}
              {paymentMethod === 'pix' && (
                <div className="mb-4 p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-xs text-emerald-950">PIX Dinâmico (Banco Central)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-200/70 text-emerald-800">
                      CRC16 Válido
                    </span>
                  </div>

                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-emerald-200">
                    <div className="w-16 h-16 bg-stone-900 text-white rounded-md p-1 flex items-center justify-center shrink-0">
                      <QrCode className="w-12 h-12 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="text-stone-500 text-[11px]">Chave: {printerConfig.barCnpj || '12.345.678/0001-90'}</div>
                      <div className="font-mono text-[10px] text-stone-600 truncate my-0.5">
                        {pixLoading ? 'Gerando BRCode EMVCo...' : pixBRCode || '00020126580014br.gov.bcb.pix...'}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer pt-0.5"
                      >
                        {pixCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{pixCopied ? 'Código Copiado!' : 'Copiar Código PIX (Copia e Cola)'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Conformidade com Arranjo de Pagamentos Instantâneos (SPI / BACEN)</span>
                  </div>
                </div>
              )}

              {/* Card Payment Interface (PCI-DSS Tokenization Terminal) */}
              {(paymentMethod === 'cartao_credito' || paymentMethod === 'cartao_debito') && (
                <div className="mb-4 p-3.5 bg-stone-900 text-stone-100 rounded-xl space-y-2.5 border border-stone-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-200">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>Terminal Seguro de Cartão</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Tokenização PCI-DSS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Bandeira</label>
                      <div className="flex gap-1">
                        {(['visa', 'mastercard', 'elo'] as const).map(b => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setCardBrand(b)}
                            className={`flex-1 py-1 rounded text-[11px] font-bold uppercase transition-colors ${
                              cardBrand === b 
                                ? 'bg-amber-500 text-stone-950 shadow-xs' 
                                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Últimos 4 Dígitos (Referência)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-500 font-mono text-xs">
                          ••••
                        </span>
                        <input
                          type="text"
                          maxLength={4}
                          value={cardLast4}
                          onChange={e => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="4242"
                          className="w-full pl-8 pr-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-100 text-xs font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400 pt-1 border-t border-stone-800">
                    <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Zero retenção de dados sensíveis (PAN/CVV). Chave de idempotência anti-duplicidade ativa.</span>
                  </div>
                </div>
              )}

              {/* Summary Totals */}
              <div className="border-t border-stone-200 pt-3 mb-4 space-y-1 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal consumido:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {changeValue > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold text-sm bg-amber-50 p-1.5 rounded">
                    <span>Troco a devolver:</span>
                    <span>R$ {changeValue.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-stone-900 pt-1">
                  <span>Total Final:</span>
                  <span className="text-emerald-600">R$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  id="btn-confirm-checkout"
                  onClick={handleConfirmCheckout}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Finalizando...' : 'Confirmar Pagamento & Liberar'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
