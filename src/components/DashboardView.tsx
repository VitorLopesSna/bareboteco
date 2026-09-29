import React from 'react';
import { 
  UtensilsCrossed, 
  Package, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Plus, 
  Printer, 
  Smartphone, 
  Wine, 
  QrCode, 
  CreditCard, 
  Banknote,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import type { Table, Order, Product, SalesReport, User } from '../types';

interface DashboardViewProps {
  tables: Table[];
  activeOrders: Record<string, Order>;
  products: Product[];
  salesReport: SalesReport | null;
  historyOrders: Order[];
  currentUser: User | null;
  onSelectTable: (table: Table) => void;
  onNavigateTab: (tab: 'dashboard' | 'tables' | 'cadastros' | 'reports' | 'waiter_mode', subTab?: string) => void;
  onOpenPrinterSettings: () => void;
  onOpenQrModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tables,
  activeOrders,
  products,
  salesReport,
  historyOrders,
  currentUser,
  onSelectTable,
  onNavigateTab,
  onOpenPrinterSettings,
  onOpenQrModal
}) => {
  // Key calculations
  const occupiedTables = tables.filter(t => t.status !== 'livre');
  const freeTables = tables.filter(t => t.status === 'livre');
  const waitingBillTables = tables.filter(t => t.status === 'aguardando_conta');
  const occupancyPercentage = tables.length > 0 
    ? Math.round((occupiedTables.length / tables.length) * 100) 
    : 0;

  // Active revenue currently running on open tables
  const runningActiveRevenue = (Object.values(activeOrders) as Order[]).reduce((sum, ord) => sum + (ord.total || 0), 0);
  
  // Total closed revenue today from salesReport
  const closedRevenue = salesReport?.totalRevenue || 0;
  const closedOrdersCount = salesReport?.totalOrders || historyOrders.length || 0;

  // Low stock alert items
  const lowStockProducts = products.filter(p => p.active && p.stock <= p.minStock);

  // Top products from sales report
  const topProducts = salesReport?.topProducts?.slice(0, 4) || [];

  const isCaixa = currentUser?.role === 'caixa';
  const cashTotal = salesReport?.paymentsBreakdown?.dinheiro ?? (salesReport?.paymentBreakdown?.dinheiro?.total || 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Compact, Refined Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              {isCaixa ? 'Sessão de Caixa • Recebimentos Ativos' : 'Sistema Online • Caixa Ativo'}
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-stone-900">
            {isCaixa ? 'Painel do Operador de Caixa' : 'Painel Geral do Boteco'}
          </h2>
          <p className="text-xs text-stone-500">
            Operador: <span className="font-bold text-stone-800">{currentUser?.name || 'Administrador'}</span> ({isCaixa ? 'Operador de Caixa' : currentUser?.role || 'admin'})
          </p>
        </div>

        {/* Quick Essential Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-dash-ver-mesas"
            onClick={() => onNavigateTab('tables')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Salão de Mesas ({occupiedTables.length})</span>
          </button>

          {!isCaixa && (
            <button
              type="button"
              id="btn-dash-mobile"
              onClick={onOpenQrModal}
              className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-all cursor-pointer"
              title="Conectar Celulares dos Garçons"
            >
              <Smartphone className="w-4 h-4 text-stone-800" />
            </button>
          )}

          <button
            type="button"
            id="btn-dash-printer"
            onClick={onOpenPrinterSettings}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-all cursor-pointer"
            title="Configurações da Impressora"
          >
            <Printer className="w-4 h-4 text-stone-800" />
          </button>
        </div>
      </div>

      {/* 4 Essential Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Closed Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Faturamento Hoje</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">
            R$ {closedRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex items-center justify-between">
            <span>{closedOrdersCount} comandas pagas</span>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-amber-700 font-bold hover:underline cursor-pointer"
            >
              Extrato
            </button>
          </div>
        </div>

        {/* Occupancy */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ocupação do Salão</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">
            {occupiedTables.length} / {tables.length} <span className="text-xs font-semibold text-stone-500">mesas</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-stone-500 mt-1">
              <span>{occupancyPercentage}% ocupado</span>
              <span>{freeTables.length} livres</span>
            </div>
          </div>
        </div>

        {/* Running Consumptions */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Consumo em Aberto</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-950 mt-2">
            R$ {runningActiveRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-stone-500 mt-1 flex items-center justify-between">
            <span>{waitingBillTables.length} pedindo conta</span>
            <button
              type="button"
              onClick={() => onNavigateTab('tables')}
              className="text-amber-700 font-bold hover:underline cursor-pointer"
            >
              Ver mesas
            </button>
          </div>
        </div>

        {/* Card 4: For Caixa -> Dinheiro em Espécie / Gaveta; For Admin -> Alerta de Estoque */}
        {isCaixa ? (
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Dinheiro no Caixa</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-2">
              R$ {cashTotal.toFixed(2)}
            </div>
            <div className="text-xs mt-1 flex items-center justify-between">
              <span className="text-stone-500">Gaveta física</span>
              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="text-amber-700 font-bold hover:underline cursor-pointer"
              >
                Conferir
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Alerta de Estoque</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                lowStockProducts.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900 mt-2">
              {lowStockProducts.length} {lowStockProducts.length === 1 ? 'item' : 'itens'}
            </div>
            <div className="text-xs mt-1 flex items-center justify-between">
              {lowStockProducts.length > 0 ? (
                <span className="text-rose-600 font-bold">Abaixo do mínimo</span>
              ) : (
                <span className="text-emerald-700 font-bold">Estoque regular</span>
              )}
              <button
                type="button"
                onClick={() => onNavigateTab('cadastros', 'estoque')}
                className="text-amber-700 font-bold hover:underline cursor-pointer"
              >
                Repor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Two Clean, Well-Organized Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Resumo do Salão (Somente mesas ativas e botão para salão completo) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                <span>Mesas Ativas no Momento</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {occupiedTables.length} {occupiedTables.length === 1 ? 'mesa com comanda aberta' : 'mesas com comandas abertas'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('tables')}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Salão Completo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {occupiedTables.length > 0 ? (
            <div className="space-y-2.5">
              {occupiedTables.slice(0, 5).map(table => {
                const order = table.currentOrderId ? activeOrders[table.currentOrderId] : undefined;
                const isWaitingBill = table.status === 'aguardando_conta';

                return (
                  <div
                    key={table.id}
                    onClick={() => onSelectTable(table)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:bg-stone-50 ${
                      isWaitingBill ? 'bg-indigo-50/70 border-indigo-200' : 'bg-stone-50/50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center font-black text-xs">
                        #{table.number}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-stone-900">{table.name}</div>
                        <div className="text-[11px] text-stone-500">
                          {isWaitingBill ? (
                            <span className="text-indigo-700 font-bold">Pediu a conta</span>
                          ) : (
                            <span>Garçom: {order?.waiterName || table.waiterName || '-'}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-sm text-stone-900">
                        R$ {(order?.total || 0).toFixed(2)}
                      </div>
                      <span className="text-[10px] text-amber-700 font-bold hover:underline">
                        Abrir Comanda
                      </span>
                    </div>
                  </div>
                );
              })}

              {occupiedTables.length > 5 && (
                <p className="text-center text-xs text-stone-400 pt-1">
                  + {occupiedTables.length - 5} outras mesas ocupadas no salão
                </p>
              )}
            </div>
          ) : (
            <div className="py-10 text-center text-stone-400 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-60" />
              <p className="font-bold text-stone-600">Salão com todas as mesas livres</p>
              <button
                type="button"
                onClick={() => onNavigateTab('tables')}
                className="text-amber-700 font-bold hover:underline"
              >
                Abrir uma mesa agora
              </button>
            </div>
          )}
        </div>

        {/* Panel 2: Formas de Pagamento & Itens Mais Pedidos */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Recebimentos & Mais Vendidos</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Distribuição dos valores recebidos no dia
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Relatório Completo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Payment Methods Compact Rows */}
          {salesReport?.paymentBreakdown ? (
            <div className="space-y-2 text-xs">
              {[
                { key: 'pix', label: 'PIX', icon: QrCode },
                { key: 'cartao_credito', label: 'Cartão Crédito', icon: CreditCard },
                { key: 'cartao_debito', label: 'Cartão Débito', icon: CreditCard },
                { key: 'dinheiro', label: 'Dinheiro', icon: Banknote }
              ].map(method => {
                const data = salesReport.paymentBreakdown[method.key as keyof typeof salesReport.paymentBreakdown] || { count: 0, total: 0 };
                const Icon = method.icon;

                return (
                  <div key={method.key} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200/60">
                    <div className="flex items-center gap-2 text-stone-700 font-semibold">
                      <Icon className="w-3.5 h-3.5 text-stone-500" />
                      <span>{method.label}</span>
                    </div>
                    <span className="font-black text-stone-900">
                      R$ {data.total.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-stone-400 text-xs">
              Ainda sem fechamentos de conta hoje.
            </div>
          )}

          {/* Top 3 Selling Products */}
          {topProducts.length > 0 && (
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Top Itens Mais Pedidos
              </span>
              <div className="space-y-1.5 text-xs">
                {topProducts.slice(0, 3).map((p, i) => (
                  <div key={p.productId} className="flex items-center justify-between py-1">
                    <span className="text-stone-700 font-medium">
                      <strong className="text-stone-900 mr-1.5">{i + 1}.</strong>
                      {p.name}
                    </span>
                    <span className="font-extrabold text-stone-900">{p.totalQuantity} un</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
