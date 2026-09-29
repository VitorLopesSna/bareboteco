import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  CheckCircle, 
  Clock, 
  User, 
  Receipt, 
  Sparkles, 
  RefreshCw,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import type { Table, Product, Order, User as UserType } from '../types';

interface WaiterAppProps {
  tables: Table[];
  products: Product[];
  activeOrders: Record<string, Order>;
  onAddItems: (tableId: string, items: Array<{ productId: string; quantity: number; notes?: string }>, waiterName: string) => Promise<void>;
  onRequestBill: (tableId: string) => Promise<void>;
  onOpenTable: (tableId: string, waiterName: string, customerName: string, guestsCount: number) => Promise<void>;
  currentUser?: UserType | null;
}

export const WaiterApp: React.FC<WaiterAppProps> = ({
  tables,
  products,
  activeOrders,
  onAddItems,
  onRequestBill,
  onOpenTable,
  currentUser
}) => {
  const [waiterName, setWaiterName] = useState(currentUser?.name || 'Garçom');
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || 'table-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart state: { [productId]: { quantity, notes } }
  const [cart, setCart] = useState<Record<string, { quantity: number; notes: string }>>({});
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [expandedCart, setExpandedCart] = useState(false);
  const [viewMode, setViewMode] = useState<'menu' | 'active_bill'>('menu');

  const currentTable = tables.find(t => t.id === selectedTableId) || tables[0];
  const currentOrder = currentTable?.currentOrderId ? activeOrders[currentTable.currentOrderId] : undefined;

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'cervejas', label: '🍺 Cervejas' },
    { id: 'drinks', label: '🍹 Drinks' },
    { id: 'doses', label: '🥃 Doses' },
    { id: 'sem_alcool', label: '🥤 Bebidas' },
    { id: 'porcoes', label: '🍟 Porções' },
    { id: 'lanches', label: '🥪 Lanches' }
  ];

  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    const matchCat = selectedCategory === 'todos' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (productId: string) => {
    setCart(prev => {
      const current = prev[productId] || { quantity: 0, notes: '' };
      return {
        ...prev,
        [productId]: { ...current, quantity: current.quantity + 1 }
      };
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const current = prev[productId];
      if (!current) return prev;
      const newQty = current.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: { ...current, quantity: newQty }
      };
    });
  };

  const updateNotes = (productId: string, notes: string) => {
    setCart(prev => {
      const current = prev[productId];
      if (!current) return prev;
      return {
        ...prev,
        [productId]: { ...current, notes }
      };
    });
  };

  const cartItems = Object.entries(cart).map(([productId, itemData]) => {
    const product = products.find(p => p.id === productId);
    const data = itemData as { quantity: number; notes: string };
    return { 
      product: product!, 
      quantity: data?.quantity || 0, 
      notes: data?.notes || '' 
    };
  }).filter(item => Boolean(item.product && item.quantity > 0));

  const totalCartValue = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSendOrder = async () => {
    if (cartItems.length === 0 || !currentTable) return;
    setIsSending(true);
    try {
      // If table is free, auto open
      if (currentTable.status === 'livre') {
        await onOpenTable(currentTable.id, waiterName, '', 2);
      }

      await onAddItems(
        currentTable.id,
        cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes
        })),
        waiterName
      );

      setCart({});
      setExpandedCart(false);
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-stone-100 flex flex-col pb-28 border-x border-stone-200 shadow-xl">
      {/* Waiter Top Bar */}
      <div className="sticky top-0 z-30 bg-stone-900 text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-stone-950">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">Comanda Mobile</div>
              <div className="text-sm font-black text-white flex items-center gap-1.5">
                <span>App do Garçom</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={waiterName}
              onChange={(e) => setWaiterName(e.target.value)}
              className="bg-stone-800 text-stone-200 text-xs font-semibold rounded-lg px-2 py-1 border border-stone-700 focus:outline-none"
            >
              <option value="Carlos (Garçom)">Carlos</option>
              <option value="Mariana (Garçom)">Mariana</option>
              <option value="Lucas (Garçom)">Lucas</option>
              <option value="Ana (Garçom)">Ana</option>
            </select>
          </div>
        </div>

        {/* Quick Table Carousel Selector */}
        <div className="mt-3">
          <div className="text-[11px] font-bold text-stone-400 mb-1 flex items-center justify-between">
            <span>SELECIONE A MESA:</span>
            <span className="text-amber-400 font-bold">{currentTable?.name} ({currentTable?.status.toUpperCase()})</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {tables.map(table => {
              const isSelected = table.id === selectedTableId;
              const isOccupied = table.status === 'ocupada';
              const isWaitingBill = table.status === 'aguardando_conta';

              let badgeColor = 'bg-stone-800 text-stone-300 border-stone-700';
              if (isOccupied) badgeColor = 'bg-amber-950 text-amber-200 border-amber-600';
              if (isWaitingBill) badgeColor = 'bg-indigo-950 text-indigo-200 border-indigo-500';
              if (isSelected) badgeColor = 'bg-amber-500 text-stone-950 font-black border-amber-400 shadow-sm';

              return (
                <button
                  key={table.id}
                  type="button"
                  id={`waiter-table-btn-${table.number}`}
                  onClick={() => setSelectedTableId(table.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${badgeColor}`}
                >
                  M{String(table.number).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mode Switcher: Cardápio vs Ver Comanda da Mesa */}
      <div className="px-3 pt-3">
        <div className="flex bg-stone-200 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('menu')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${viewMode === 'menu' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-600'}`}
          >
            Cardápio & Pedidos
          </button>
          <button
            type="button"
            onClick={() => setViewMode('active_bill')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${viewMode === 'active_bill' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-600'}`}
          >
            Mesa Atual ({currentOrder?.items.length || 0} itens)
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {sentSuccess && (
        <div className="mx-3 mt-3 p-3 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900 shadow-sm animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pedido enviado com sucesso para o Bar e Cozinha!</span>
        </div>
      )}

      {viewMode === 'menu' ? (
        /* MENU & ITEMS SECTION */
        <div className="p-3 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="waiter-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar chopp, cerveja, porção..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                  selectedCategory === cat.id 
                    ? 'bg-stone-900 text-white shadow-xs' 
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Products List */}
          <div className="space-y-2">
            {filteredProducts.map(product => {
              const inCartQty = cart[product.id]?.quantity || 0;

              return (
                <div 
                  key={product.id}
                  className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-stone-900 truncate">{product.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-black text-amber-700">R$ {product.price.toFixed(2)}</span>
                      <span className="text-[10px] text-stone-400">• {product.unit}</span>
                      {product.stock <= product.minStock && (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">
                          Restam {product.stock}
                        </span>
                      )}
                    </div>
                  </div>

                  {inCartQty > 0 ? (
                    <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, -1)}
                        className="w-7 h-7 bg-white rounded-lg border border-stone-200 font-bold text-stone-700 flex items-center justify-center hover:bg-stone-200"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-black text-xs text-stone-900 w-5 text-center">{inCartQty}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, 1)}
                        className="w-7 h-7 bg-amber-600 text-white rounded-lg font-bold flex items-center justify-center hover:bg-amber-700 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(product.id)}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ACTIVE TABLE BILL PREVIEW */
        <div className="p-3 space-y-3">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm">{currentTable.name}</h3>
                <p className="text-[11px] text-stone-500">
                  {currentTable.waiterName ? `Atendido por ${currentTable.waiterName}` : 'Sem garçom atribuído'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-amber-700">R$ {(currentTable.total || 0).toFixed(2)}</div>
                <div className="text-[10px] text-stone-400">{currentOrder?.items.length || 0} itens lançados</div>
              </div>
            </div>

            {currentOrder?.items && currentOrder.items.length > 0 ? (
              <div className="divide-y divide-stone-100 max-h-[360px] overflow-y-auto pr-1">
                {currentOrder.items.map((item, idx) => (
                  <div key={item.id || idx} className="py-2 flex items-start justify-between text-xs">
                    <div>
                      <div className="font-bold text-stone-900">
                        {item.quantity}x {item.name}
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-amber-700 font-medium">Obs: {item.notes}</div>
                      )}
                      <div className="text-[10px] text-stone-400">
                        {new Date(item.orderedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {item.waiterName}
                      </div>
                    </div>
                    <div className="font-bold text-stone-800">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-stone-400">
                Nenhum pedido lançado nesta mesa ainda.
              </div>
            )}

            {currentTable.status !== 'livre' && (
              <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
                <button
                  type="button"
                  id="btn-waiter-request-bill"
                  onClick={() => onRequestBill(currentTable.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-50 border border-indigo-300 text-indigo-800 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Pedir Conta no Caixa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom Floating Cart Drawer */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-stone-300 shadow-2xl p-3 z-40">
          {/* Collapse/Expand Toggle Header */}
          <div 
            onClick={() => setExpandedCart(!expandedCart)}
            className="flex items-center justify-between pb-2 cursor-pointer text-xs font-bold text-stone-700"
          >
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full text-xs font-black">
                {totalCartCount}
              </span>
              <span>Bandeja para {currentTable.name}</span>
            </div>
            <div className="flex items-center gap-1 text-stone-500">
              <span>{expandedCart ? 'Recolher' : 'Ver detalhes'}</span>
              {expandedCart ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>

          {/* Expanded Cart Details with Observations */}
          {expandedCart && (
            <div className="max-h-48 overflow-y-auto divide-y divide-stone-100 py-2 my-1 border-t border-stone-200">
              {cartItems.map(({ product, quantity, notes }) => (
                <div key={product.id} className="py-2 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-stone-900 truncate max-w-[180px]">{product.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-600">R$ {(product.price * quantity).toFixed(2)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, -1)}
                          className="w-5 h-5 bg-stone-100 rounded text-stone-700 font-bold"
                        >
                          -
                        </button>
                        <span className="w-4 text-center font-bold text-xs">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, 1)}
                          className="w-5 h-5 bg-stone-100 rounded text-stone-700 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Quick observation input */}
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => updateNotes(product.id, e.target.value)}
                    placeholder="Obs: sem cebola, gelo e limão..."
                    className="w-full text-[11px] px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            id="btn-waiter-send-order"
            onClick={handleSendOrder}
            disabled={isSending}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-between px-4"
          >
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sincronizando...' : 'Enviar Pedido ao Bar'}</span>
            </div>
            <span className="bg-amber-700/60 px-2.5 py-1 rounded-lg">
              R$ {totalCartValue.toFixed(2)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
