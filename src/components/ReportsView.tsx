import React, { useState } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Printer, 
  Search,
  CheckCircle,
  CheckCircle2,
  FileText,
  RotateCcw,
  AlertTriangle,
  UtensilsCrossed,
  X
} from 'lucide-react';
import type { SalesReport, Order, Product, Table, User } from '../types';

interface ReportsViewProps {
  report: SalesReport | null;
  historyOrders: Order[];
  products: Product[];
  tables: Table[];
  currentUser?: User | null;
  onReprintOrder: (order: Order) => void;
  onReopenOrder: (order: Order, targetTableId?: string) => Promise<void>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  report,
  historyOrders,
  products,
  tables,
  currentUser,
  onReprintOrder,
  onReopenOrder
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'resumo' | 'historico'>('resumo');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const isCaixa = currentUser?.role === 'caixa';

  // Reopen Order Modal State
  const [reopenModalOrder, setReopenModalOrder] = useState<Order | null>(null);
  const [targetTableId, setTargetTableId] = useState<string>('');
  const [isReopening, setIsReopening] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  const handleOpenReopenModal = (order: Order) => {
    setReopenModalOrder(order);
    setReopenError(null);
    const origTable = tables.find(t => t.id === order.tableId);
    if (origTable && origTable.status === 'livre') {
      setTargetTableId(origTable.id);
    } else {
      const firstFree = tables.find(t => t.status === 'livre');
      setTargetTableId(firstFree ? firstFree.id : '');
    }
  };

  const handleConfirmReopen = async () => {
    if (!reopenModalOrder) return;
    try {
      setIsReopening(true);
      setReopenError(null);
      await onReopenOrder(reopenModalOrder, targetTableId || undefined);
      setReopenModalOrder(null);
    } catch (err: any) {
      setReopenError(err.message || 'Erro ao reativar comanda');
    } finally {
      setIsReopening(false);
    }
  };

  if (!report) {
    return (
      <div className="py-12 text-center text-stone-500 text-xs">
        Carregando relatórios de vendas e financeiro...
      </div>
    );
  }

  const paymentIcons: Record<string, any> = {
    dinheiro: Banknote,
    pix: QrCode,
    cartao_credito: CreditCard,
    cartao_debito: CreditCard
  };

  const paymentLabels: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'PIX Instantâneo',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito'
  };

  const marginPercent = report.totalRevenue > 0 
    ? ((report.grossProfit / report.totalRevenue) * 100).toFixed(1) 
    : '0';

  // Filter history orders
  const filteredHistory = historyOrders.filter(order => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    return (
      order.tableName.toLowerCase().includes(q) ||
      (order.customerName && order.customerName.toLowerCase().includes(q)) ||
      (order.waiterName && order.waiterName.toLowerCase().includes(q)) ||
      order.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Subdivided Sub-Navigation Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <span>Vendas & Caixa</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Fechamento do caixa, lucratividade e auditoria de comandas finalizadas
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-bold overflow-x-auto max-w-full">
          <button
            type="button"
            id="subtab-report-resumo"
            onClick={() => setActiveReportTab('resumo')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeReportTab === 'resumo'
                ? 'bg-white text-stone-950 shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>Resumo Financeiro & Caixa</span>
          </button>

          <button
            type="button"
            id="subtab-report-historico"
            onClick={() => setActiveReportTab('historico')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeReportTab === 'historico'
                ? 'bg-white text-stone-950 shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-stone-600" />
            <span>Histórico de Comandas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700">
              {historyOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-view 1: Resumo Financeiro & Vendas */}
      {activeReportTab === 'resumo' && (
        <div className="space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Faturamento Total</span>
                <div className="text-2xl font-black text-stone-900 mt-1">
                  R$ {report.totalRevenue.toFixed(2)}
                </div>
                <span className="text-xs text-stone-600">Período: {report.period}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Gross Profit (Admin) or Cash Register Total (Caixa) */}
            {isCaixa ? (
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Dinheiro no Caixa</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    R$ {(report.paymentsBreakdown?.dinheiro || 0).toFixed(2)}
                  </div>
                  <span className="text-xs text-stone-600">Conferência física na gaveta</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Lucro Bruto Estimado</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    R$ {report.grossProfit.toFixed(2)}
                  </div>
                  <span className="text-xs text-emerald-600 font-bold">Margem média: {marginPercent}%</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            )}

            {/* Orders Closed */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Comandas Fechadas</span>
                <div className="text-2xl font-black text-stone-900 mt-1">
                  {report.totalOrders}
                </div>
                <span className="text-xs text-stone-600">Atendimentos finalizados</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            {/* Average Ticket */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Ticket Médio</span>
                <div className="text-2xl font-black text-stone-900 mt-1">
                  R$ {report.averageTicket.toFixed(2)}
                </div>
                <span className="text-xs text-stone-600">Gasto médio por mesa</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Two Column Grid: Payment Breakdown & Top Selling Products */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Payment Methods Breakdown */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm mb-1">Recebimentos por Forma de Pagamento</h3>
                <p className="text-xs text-stone-500 mb-4">Divisão dos valores recebidos no caixa</p>

                <div className="space-y-3.5">
                  {Object.entries(report.paymentsBreakdown).map(([method, val]) => {
                    const amount = Number(val) || 0;
                    const Icon = paymentIcons[method] || CreditCard;
                    const label = paymentLabels[method] || method;
                    const percent = report.totalRevenue > 0 ? (amount / report.totalRevenue) * 100 : 0;

                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-2 text-stone-800">
                            <Icon className="w-4 h-4 text-stone-500" />
                            <span>{label}</span>
                          </div>
                          <span className="text-stone-900 font-extrabold">
                            R$ {amount.toFixed(2)} <span className="text-stone-400 font-normal">({percent.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <h3 className="font-extrabold text-stone-900 text-sm mb-1">Itens Mais Vendidos</h3>
              <p className="text-xs text-stone-500 mb-4">Produtos com maior saída no bar</p>

              {report.topProducts && report.topProducts.length > 0 ? (
                <div className="space-y-2.5">
                  {report.topProducts.slice(0, 6).map((prod, index) => (
                    <div 
                      key={prod.productId}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          index === 0 ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-bold text-stone-900 truncate">{prod.productName}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-stone-900">{prod.quantity} un</span>
                        <span className="text-stone-400 text-[11px] block">R$ {prod.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-stone-400">
                  Nenhuma venda registrada ainda no período.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-view 2: Histórico de Comandas & Auditoria */}
      {activeReportTab === 'historico' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          {/* Header & Filter Bar */}
          <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 bg-stone-50/60">
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm">Histórico de Comandas Finalizadas</h3>
              <p className="text-xs text-stone-500">Auditoria completa dos fechamentos com comprovantes para impressão</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar mesa, garçom ou cliente..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <span className="text-xs font-bold text-stone-600 bg-stone-200/80 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                {filteredHistory.length} de {historyOrders.length} comandas
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-500 uppercase font-bold text-[11px] border-b border-stone-200">
                <tr>
                  <th className="px-6 py-3">Comanda / Mesa</th>
                  <th className="px-4 py-3">Garçom</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fechamento</th>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3 text-right">Total Pago</th>
                  <th className="px-6 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredHistory.slice().reverse().map(order => (
                  <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-stone-900">
                      <div className="flex items-center gap-1.5">
                        <span>{order.tableName}</span>
                        <span className="text-[10px] text-stone-400 font-mono">#{order.id.slice(-4)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-stone-600 font-medium">
                      {order.waiterName || 'Caixa'}
                    </td>

                    <td className="px-4 py-3.5 text-stone-700">
                      {order.customerName || '-'}
                    </td>

                    <td className="px-4 py-3.5 text-stone-500">
                      {order.closedAt ? new Date(order.closedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-semibold text-[11px] capitalize">
                        {order.paymentMethod || 'Dinheiro'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-black text-stone-900 text-sm">
                      R$ {order.total.toFixed(2)}
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenReopenModal(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Reativar comanda fechada por engano"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Reativar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onReprintOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="Reimprimir comanda ou comprovante térmico"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reimprimir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredHistory.length === 0 && (
              <div className="py-12 text-center text-xs text-stone-400">
                Nenhuma comanda encontrada com os filtros informados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Reativação de Comanda Fechada por Engano */}
      {reopenModalOrder && (() => {
        const origTable = tables.find(t => t.id === reopenModalOrder.tableId);
        const isOrigLivre = origTable?.status === 'livre';
        const freeTables = tables.filter(t => t.status === 'livre');
        const canReopen = isOrigLivre || (freeTables.length > 0 && targetTableId);

        return (
          <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-stone-900 text-base leading-tight">Reativar Comanda</h3>
                    <p className="text-xs text-stone-500">Reabrir comanda fechada por engano no salão</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReopenModalOrder(null)}
                  disabled={isReopening}
                  className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Order Details Card */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 mb-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-900 text-sm">{reopenModalOrder.tableName}</span>
                    <span className="text-[11px] font-mono font-bold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md">
                      #{reopenModalOrder.id.slice(-4)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">Total Registrado</span>
                    <span className="font-black text-emerald-800 text-base">R$ {reopenModalOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-xs text-stone-600 grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/80">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Atendente</span>
                    <span className="font-semibold">{reopenModalOrder.waiterName || 'Garçom'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Cliente</span>
                    <span className="font-semibold">{reopenModalOrder.customerName || 'Não informado'}</span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="pt-2 border-t border-stone-200/80">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold mb-1">
                    Itens da Comanda ({reopenModalOrder.items.length})
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 text-xs text-stone-700 pr-1">
                    {reopenModalOrder.items.map((it) => (
                      <div key={it.id} className="flex justify-between py-0.5">
                        <span>{it.quantity}x {it.name}</span>
                        <span className="font-semibold text-stone-800">R$ {(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table Availability Validation */}
              <div className="mb-5 space-y-3">
                {isOrigLivre ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-emerald-900 text-xs">Mesa Original Livre</h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        A <strong>{origTable?.name || reopenModalOrder.tableName}</strong> está livre no salão. A comanda será reaberta nela imediatamente e o caixa estornado.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-amber-900 text-xs">Mesa Original Ocupada</h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        A <strong>{origTable?.name || reopenModalOrder.tableName}</strong> já está ocupada por novos clientes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Target table selector */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-stone-500" />
                    <span>Mesa para Reabertura:</span>
                  </label>

                  {freeTables.length > 0 ? (
                    <select
                      value={targetTableId}
                      onChange={(e) => setTargetTableId(e.target.value)}
                      disabled={isReopening}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {isOrigLivre && origTable && (
                        <option value={origTable.id}>
                          {origTable.name} (Mesa original - Livre)
                        </option>
                      )}
                      {freeTables
                        .filter(t => t.id !== origTable?.id)
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} (Livre - {t.capacity} lugares)
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
                      ⚠️ Não há nenhuma mesa livre no salão no momento. Finalize ou transfira uma mesa antes de reativar esta comanda.
                    </div>
                  )}
                </div>

                {reopenError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
                    {reopenError}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setReopenModalOrder(null)}
                  disabled={isReopening}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmReopen}
                  disabled={!canReopen || isReopening}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  {isReopening ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Reativando...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Confirmar Reativação</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
