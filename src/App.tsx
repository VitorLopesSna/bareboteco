import React, { useState, useEffect, useCallback } from 'react';
import type { 
  Table, 
  Product, 
  Order, 
  StockMovement, 
  PrinterConfig, 
  SalesReport,
  User 
} from './types';
import * as api from './services/api';
import { Navbar } from './components/Navbar';
import { TableCard } from './components/TableCard';
import { TableDetailModal } from './components/TableDetailModal';
import { ThermalReceipt } from './components/ThermalReceipt';
import { WaiterApp } from './components/WaiterApp';
import { StockManager } from './components/StockManager';
import { ReportsView } from './components/ReportsView';
import { DashboardView } from './components/DashboardView';
import { CadastrosView } from './components/CadastrosView';
import { PrinterSettingsModal } from './components/PrinterSettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { SecurityShieldModal } from './components/SecurityShieldModal';
import { playNewOrderSound, playBillAlertSound } from './utils/sound';
import { 
  Filter, 
  Plus, 
  Bell, 
  CheckCircle2, 
  Printer, 
  Smartphone, 
  Monitor, 
  Layers, 
  Coffee, 
  RotateCcw,
  Sparkles,
  Wine
} from 'lucide-react';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);

  // App navigation state - organized by user request: Dashboard, Mesas, Cadastros, etc.
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'tables' | 'cadastros' | 'stock' | 'reports' | 'waiter_mode'>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('mode=garcom')) {
      return 'waiter_mode';
    }
    return 'dashboard';
  });

  const [cadastrosSubTab, setCadastrosSubTab] = useState<'produtos' | 'mesas' | 'estoque' | 'equipe'>('produtos');
  const [showQrModal, setShowQrModal] = useState(false);

  // Core data states
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeOrders, setActiveOrders] = useState<Record<string, Order>>({});
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
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
  });
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);

  // UI Modals & Overlays
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [printModalData, setPrintModalData] = useState<{
    order: Order;
    type: 'kitchen' | 'bill' | 'payment_receipt';
  } | null>(null);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [showSecurityShield, setShowSecurityShield] = useState(false);

  // System flags
  const [sseConnected, setSseConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tableFilter, setTableFilter] = useState<'todos' | 'livre' | 'ocupada' | 'aguardando_conta'>('todos');
  const [notificationToast, setNotificationToast] = useState<{ title: string; message: string } | null>(null);

  // Load initial state
  const loadState = useCallback(async () => {
    try {
      const data = await api.fetchAppState();
      setTables(data.tables);
      setProducts(data.products);
      setActiveOrders(data.activeOrders);
      setHistoryOrders(data.historyOrders);
      setStockMovements(data.stockMovements);
      if (data.printerConfig) setPrinterConfig(data.printerConfig);

      // Load report
      const rep = await api.fetchReports();
      setSalesReport(rep);
    } catch (err) {
      console.error('Error fetching app state:', err);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Verify authenticated session against server database
  useEffect(() => {
    api.checkCurrentUser()
      .then(user => {
        setCurrentUser(user);
      })
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  // Enforce role-based tab restriction so garçom and caixa stay within their allowed views
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'garcom') {
      if (currentTab !== 'tables' && currentTab !== 'waiter_mode') {
        setCurrentTab('tables');
      }
    } else if (currentUser.role === 'caixa') {
      if (currentTab === 'cadastros' || currentTab === 'stock') {
        setCurrentTab('dashboard');
      }
    }
  }, [currentUser?.role, currentTab]);

  const handleLogout = async () => {
    await api.logoutUser();
    setCurrentUser(null);
  };

  // Connect to SSE for Real-Time synchronization
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, data } = payload;

          if (type === 'CONNECTED') {
            setSseConnected(true);
          } else if (type === 'ITEMS_ADDED') {
            // Update table & order
            setTables(prev => prev.map(t => t.id === data.table.id ? data.table : t));
            setActiveOrders(prev => ({ ...prev, [data.order.id]: data.order }));
            if (data.products) setProducts(data.products);

            // Audio chime & notification
            if (soundEnabled) playNewOrderSound();
            setNotificationToast({
              title: `🔔 Novo Pedido: ${data.table.name}`,
              message: `${data.newItems?.length || 1} novos itens lançados por ${data.order.waiterName || 'Garçom'}`
            });

            // Update selected table if open in modal
            setSelectedTable(curr => curr && curr.id === data.table.id ? data.table : curr);

            // Refresh report in background
            api.fetchReports().then(setSalesReport).catch(() => {});
          } else if (type === 'TABLE_OPENED' || type === 'ORDER_REOPENED') {
            setTables(prev => prev.map(t => t.id === data.table.id ? data.table : t));
            setActiveOrders(prev => ({ ...prev, [data.order.id]: data.order }));
            if (type === 'ORDER_REOPENED') {
              setHistoryOrders(prev => prev.filter(o => o.id !== data.order.id));
              if (soundEnabled) playNewOrderSound();
              setNotificationToast({
                title: `♻️ Comanda Reativada: ${data.table.name}`,
                message: `Comanda #${data.order.id.slice(-4)} reaberta no salão!`
              });
            }
            setSelectedTable(curr => curr && curr.id === data.table.id ? data.table : curr);
            api.fetchReports().then(setSalesReport).catch(() => {});
          } else if (type === 'BILL_REQUESTED') {
            setTables(prev => prev.map(t => t.id === data.table.id ? data.table : t));
            if (soundEnabled) playBillAlertSound();
            setNotificationToast({
              title: `💰 Conta Solicitada: ${data.table.name}`,
              message: `Total a fechar: R$ ${(data.order?.total || 0).toFixed(2)}`
            });
            setSelectedTable(curr => curr && curr.id === data.table.id ? data.table : curr);
          } else if (type === 'TABLE_CLOSED') {
            setTables(prev => prev.map(t => t.id === data.table.id ? data.table : t));
            setActiveOrders(prev => {
              const next = { ...prev };
              delete next[data.closedOrder.id];
              return next;
            });
            setHistoryOrders(prev => [...prev, data.closedOrder]);
            setSelectedTable(curr => curr && curr.id === data.table.id ? null : curr);
            api.fetchReports().then(setSalesReport).catch(() => {});
          } else if (type === 'STOCK_ADJUSTED' || type === 'PRODUCT_UPDATED' || type === 'PRODUCT_CREATED') {
            if (data.product) {
              setProducts(prev => {
                const idx = prev.findIndex(p => p.id === data.product.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = data.product;
                  return updated;
                }
                return [...prev, data.product];
              });
            }
            if (data.movement) {
              setStockMovements(prev => [...prev, data.movement]);
            }
            api.fetchReports().then(setSalesReport).catch(() => {});
          } else if (type === 'PRINTER_CONFIG_UPDATED') {
            if (data.printerConfig) setPrinterConfig(data.printerConfig);
          }
        } catch (e) {
          console.error('Error handling SSE event:', e);
        }
      };

      eventSource.onerror = () => {
        setSseConnected(false);
        eventSource?.close();
        // Retry connection in 3 seconds
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      eventSource?.close();
    };
  }, [soundEnabled]);

  // Dismiss toast automatically
  useEffect(() => {
    if (notificationToast) {
      const t = setTimeout(() => setNotificationToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notificationToast]);

  // Table operations
  const handleOpenTable = async (tableId: string, waiterName: string, customerName: string, guestsCount: number) => {
    const res = await api.openTable(tableId, waiterName, customerName, guestsCount);
    setTables(prev => prev.map(t => t.id === res.table.id ? res.table : t));
    setActiveOrders(prev => ({ ...prev, [res.order.id]: res.order }));
    setSelectedTable(res.table);
  };

  const handleAddItems = async (tableId: string, items: Array<{ productId: string; quantity: number; notes?: string }>, waiterName?: string) => {
    const res = await api.addItemsToTable(tableId, items, waiterName);
    setTables(prev => prev.map(t => t.id === res.table.id ? res.table : t));
    setActiveOrders(prev => ({ ...prev, [res.order.id]: res.order }));
    setSelectedTable(curr => curr && curr.id === res.table.id ? res.table : curr);

    // If configured to auto open print dialog for kitchen slip
    if (printerConfig.autoPrintKitchen && currentTab !== 'waiter_mode') {
      setPrintModalData({ order: res.order, type: 'kitchen' });
    }
  };

  const handleRequestBill = async (tableId: string) => {
    const res = await api.requestTableBill(tableId);
    setTables(prev => prev.map(t => t.id === res.table.id ? res.table : t));
    setSelectedTable(curr => curr && curr.id === res.table.id ? res.table : curr);
  };

  const handleCheckout = async (tableId: string, data: {
    paymentMethod: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito';
    discount?: number;
    includeServiceTax?: boolean;
    customerName?: string;
  }) => {
    const res = await api.checkoutTable(tableId, data);
    setTables(prev => prev.map(t => t.id === res.table.id ? res.table : t));
    setActiveOrders(prev => {
      const next = { ...prev };
      delete next[res.closedOrder.id];
      return next;
    });
    setHistoryOrders(prev => [...prev, res.closedOrder]);
    setSelectedTable(null);

    // Option to print receipt
    setPrintModalData({ order: res.closedOrder, type: 'payment_receipt' });

    // Refresh reports
    const rep = await api.fetchReports();
    setSalesReport(rep);
  };

  const handleMarkPrinted = async (tableId: string) => {
    const res = await api.markItemsAsPrinted(tableId);
    setTables(prev => prev.map(t => t.id === res.table.id ? res.table : t));
    setActiveOrders(prev => ({ ...prev, [res.order.id]: res.order }));
    setSelectedTable(curr => curr && curr.id === res.table.id ? res.table : curr);
  };

  const handleReopenOrder = async (order: Order, targetTableId?: string) => {
    const res = await api.reopenOrder(order.id, targetTableId);
    setTables(prev => prev.map(t => t.id === res.table.id ? res.table : t));
    setActiveOrders(prev => ({ ...prev, [res.order.id]: res.order }));
    setHistoryOrders(prev => prev.filter(o => o.id !== order.id));
    
    // Refresh sales and stock reports
    const rep = await api.fetchReports();
    setSalesReport(rep);

    setNotificationToast({
      title: '♻️ Comanda Reativada',
      message: `Comanda #${res.order.id.slice(-4)} retornou com sucesso para a ${res.table.name}!`
    });

    // Automatically navigate to tables view and focus the reopened table
    setCurrentTab('tables');
    setSelectedTable(res.table);
  };

  // Stock operations
  const handleAddProduct = async (prod: Partial<Product>) => {
    const newP = await api.createProduct(prod);
    setProducts(prev => [...prev, newP]);
  };

  const handleUpdateProduct = async (id: string, prod: Partial<Product>) => {
    const updated = await api.updateProduct(id, prod);
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
  };

  const handleAdjustStock = async (productId: string, delta: number, reason: string, type: string) => {
    const res = await api.adjustStock(productId, delta, reason, type);
    setProducts(prev => prev.map(p => p.id === productId ? res.product : p));
    setStockMovements(prev => [...prev, res.movement]);
    const rep = await api.fetchReports();
    setSalesReport(rep);
  };

  const handleSavePrinterConfig = async (cfg: Partial<PrinterConfig>) => {
    const updated = await api.updatePrinterConfig(cfg);
    setPrinterConfig(updated);
  };

  // Test thermal print
  const handleTestPrint = () => {
    const testOrder: Order = {
      id: 'test-print',
      tableId: 'table-1',
      tableNumber: 1,
      tableName: 'Mesa 01 (TESTE)',
      status: 'fechada',
      items: [
        {
          id: 'test-item-1',
          productId: 'prod-1',
          name: 'Chopp Brahma 300ml',
          price: 9.00,
          costPrice: 3.20,
          quantity: 2,
          notes: 'Teste de impressão',
          orderedAt: new Date().toISOString(),
          waiterName: 'Sistema',
          printedToKitchen: true
        }
      ],
      openedAt: new Date().toISOString(),
      waiterName: 'Teste',
      customerName: 'Cliente Teste',
      subtotal: 18.00,
      serviceTaxPercent: 10,
      serviceTaxAmount: 1.80,
      discount: 0,
      total: 19.80,
      paymentMethod: 'pix'
    };
    setShowPrinterSettings(false);
    setPrintModalData({ order: testOrder, type: 'kitchen' });
  };

  // Filtered tables
  const filteredTables = tables.filter(t => {
    if (tableFilter === 'todos') return true;
    return t.status === tableFilter;
  });

  const handleAddTable = (name: string, capacity: number) => {
    const newNum = tables.length + 1;
    const newTable: Table = {
      id: `table-${Date.now()}`,
      number: newNum,
      name: name || `Mesa ${newNum}`,
      capacity: capacity || 4,
      status: 'livre',
      waiterName: null,
      guestsCount: 0,
      currentOrderId: null,
      updatedAt: new Date().toISOString()
    };
    setTables(prev => [...prev, newTable]);
    setNotificationToast({
      title: 'Mesa Cadastrada',
      message: `${newTable.name} (${newTable.capacity} lugares) adicionada com sucesso ao salão!`
    });
  };

  const occupiedCount = tables.filter(t => t.status !== 'livre').length;
  const lowStockCount = products.filter(p => p.active && p.stock <= p.minStock).length;
  const totalUnprinted = tables.reduce((sum, t) => sum + (t.unprintedCount || 0), 0);

  // Authentication Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 text-stone-100">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-xl shadow-amber-500/20 mb-4 animate-pulse">
          <Wine className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black tracking-tight text-white mb-1">Boteco & Bar</h2>
        <div className="flex items-center gap-2 text-xs text-stone-400 mt-2">
          <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Verificando autenticação no banco de dados...</span>
        </div>
      </div>
    );
  }

  // Not Authenticated -> Show Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col selection:bg-amber-200">
      {/* Real-time Notification Floating Alert */}
      {notificationToast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-stone-900 text-white p-4 rounded-2xl shadow-2xl border border-stone-700 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm text-white">{notificationToast.title}</div>
            <div className="text-xs text-stone-300 mt-0.5">{notificationToast.message}</div>
          </div>
          <button 
            type="button"
            onClick={() => setNotificationToast(null)}
            className="text-stone-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'cadastros') setCadastrosSubTab('produtos');
        }}
        occupiedCount={occupiedCount}
        totalTables={tables.length}
        lowStockCount={lowStockCount}
        unprintedCount={totalUnprinted}
        sseConnected={sseConnected}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenPrinterSettings={() => setShowPrinterSettings(true)}
        onOpenSecurityShield={() => setShowSecurityShield(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        showQrModalDirect={showQrModal}
        onCloseQrModal={() => setShowQrModal(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 pb-24 md:pb-8">
        {/* Role Context Notification Banners */}
        {currentUser?.role === 'garcom' && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-950 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-black">Perfil Garçom:</span>
              <span className="text-emerald-800">Visualização simplificada para atendimento às mesas e lançamento de pedidos.</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentTab(currentTab === 'waiter_mode' ? 'tables' : 'waiter_mode')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              {currentTab === 'waiter_mode' ? 'Ver Salão de Mesas' : 'Alternar para Modo Garçom Mobile'}
            </button>
          </div>
        )}

        {currentUser?.role === 'caixa' && (
          <div className="mb-4 bg-sky-50 border border-sky-200 text-sky-950 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
              <span className="font-black">Perfil Operador de Caixa:</span>
              <span className="text-sky-800">Interface focada no salão, conferência de contas, recebimentos e fechamento diário.</span>
            </div>
            <span className="text-[11px] text-sky-700 font-semibold hidden md:inline">
              Módulos administrativos ocultados
            </span>
          </div>
        )}

        {/* 1. Dashboard View */}
        {currentTab === 'dashboard' && (
          <DashboardView
            tables={tables}
            activeOrders={activeOrders}
            products={products}
            salesReport={salesReport}
            historyOrders={historyOrders}
            currentUser={currentUser}
            onSelectTable={(table) => setSelectedTable(table)}
            onNavigateTab={(tab, subTab) => {
              setCurrentTab(tab);
              if (subTab) {
                setCadastrosSubTab(subTab as 'produtos' | 'mesas' | 'estoque' | 'equipe');
              }
            }}
            onOpenPrinterSettings={() => setShowPrinterSettings(true)}
            onOpenQrModal={() => setShowQrModal(true)}
          />
        )}

        {/* 2. Tables & Floor View */}
        {currentTab === 'tables' && (
          <div className="space-y-6">
            {/* Top Table Filter & Quick Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-bold overflow-x-auto max-w-full">
                <button
                  type="button"
                  id="filter-tables-todos"
                  onClick={() => setTableFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    tableFilter === 'todos' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Todas as Mesas ({tables.length})
                </button>
                <button
                  type="button"
                  id="filter-tables-livres"
                  onClick={() => setTableFilter('livre')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    tableFilter === 'livre' ? 'bg-white shadow-xs text-emerald-800 font-extrabold' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Livres ({tables.filter(t => t.status === 'livre').length})
                </button>
                <button
                  type="button"
                  id="filter-tables-ocupadas"
                  onClick={() => setTableFilter('ocupada')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    tableFilter === 'ocupada' ? 'bg-white shadow-xs text-amber-800 font-extrabold' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Ocupadas ({tables.filter(t => t.status === 'ocupada').length})
                </button>
                <button
                  type="button"
                  id="filter-tables-conta"
                  onClick={() => setTableFilter('aguardando_conta')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    tableFilter === 'aguardando_conta' ? 'bg-white shadow-xs text-indigo-800 font-extrabold' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Pediram Conta ({tables.filter(t => t.status === 'aguardando_conta').length})
                </button>
              </div>

              {/* Status summary info */}
              <div className="flex items-center gap-3 text-xs font-bold text-stone-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Livres</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Ocupadas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span>Pediram Conta</span>
                </div>
              </div>
            </div>

            {/* Tables Floor Grid - Adaptive across 320px to 4K */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
              {filteredTables.map(table => {
                const order = table.currentOrderId ? activeOrders[table.currentOrderId] : undefined;

                return (
                  <TableCard
                    key={table.id}
                    table={table}
                    order={order}
                    onClick={(t) => setSelectedTable(t)}
                    onQuickAdd={(t) => setSelectedTable(t)}
                    onQuickPrint={(t) => {
                      if (order) {
                        setPrintModalData({ order, type: 'kitchen' });
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Cadastros View (Cardápio, Mesas, Estoque, Equipe) */}
        {(currentTab === 'cadastros' || currentTab === 'stock') && (
          <CadastrosView
            products={products}
            stockMovements={stockMovements}
            tables={tables}
            initialSubTab={cadastrosSubTab}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onAdjustStock={handleAdjustStock}
            onAddTable={handleAddTable}
          />
        )}

        {/* 4. Sales & Financial Reports View */}
        {currentTab === 'reports' && (
          <ReportsView
            report={salesReport}
            historyOrders={historyOrders}
            products={products}
            tables={tables}
            currentUser={currentUser}
            onReprintOrder={(order) => setPrintModalData({ order, type: 'payment_receipt' })}
            onReopenOrder={handleReopenOrder}
          />
        )}

        {/* Waiter Mobile Mode View */}
        {currentTab === 'waiter_mode' && (
          <div>
            <div className="mb-4 flex items-center justify-between max-w-md mx-auto bg-stone-900 text-white p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Simulador App Garçom (Mobile)</span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentTab('tables')}
                className="text-xs text-amber-400 font-bold hover:underline"
              >
                Voltar ao Painel do Bar
              </button>
            </div>

            <WaiterApp
              tables={tables}
              products={products}
              activeOrders={activeOrders}
              onAddItems={handleAddItems}
              onRequestBill={handleRequestBill}
              onOpenTable={handleOpenTable}
              currentUser={currentUser}
            />
          </div>
        )}
      </main>

      {/* Table Detail Modal (Order items, add items, checkout, and payments) */}
      {selectedTable && (
        <TableDetailModal
          table={selectedTable}
          order={selectedTable.currentOrderId ? activeOrders[selectedTable.currentOrderId] : undefined}
          products={products}
          printerConfig={printerConfig}
          onClose={() => setSelectedTable(null)}
          onOpenTable={handleOpenTable}
          onAddItems={handleAddItems}
          onRequestBill={handleRequestBill}
          onCheckout={handleCheckout}
          onOpenPrint={(order, type) => setPrintModalData({ order, type })}
          onMarkPrinted={handleMarkPrinted}
          defaultWaiterName={currentUser?.name}
          currentUserRole={currentUser?.role}
        />
      )}

      {/* Thermal Receipt Print Modal (58mm / 80mm preview & browser print) */}
      {printModalData && (
        <ThermalReceipt
          order={printModalData.order}
          type={printModalData.type}
          config={printerConfig}
          onClose={() => setPrintModalData(null)}
          onPrinted={() => {
            if (printModalData.type === 'kitchen') {
              handleMarkPrinted(printModalData.order.tableId);
            }
          }}
        />
      )}

      {/* Thermal Printer Settings Modal */}
      {showPrinterSettings && (
        <PrinterSettingsModal
          config={printerConfig}
          onClose={() => setShowPrinterSettings(false)}
          onSave={handleSavePrinterConfig}
          onTestPrint={handleTestPrint}
        />
      )}

      {/* Active Security & Defense Shield Modal */}
      <SecurityShieldModal
        isOpen={showSecurityShield}
        onClose={() => setShowSecurityShield(false)}
        currentUserRole={currentUser?.role}
      />
    </div>
  );
}
