import React from 'react';
import { Clock, User, AlertCircle, UtensilsCrossed, Receipt, ChevronRight } from 'lucide-react';
import type { Table, Order } from '../types';

interface TableCardProps {
  table: Table;
  order?: Order;
  onClick: (table: Table) => void;
  onQuickAdd: (table: Table) => void;
  onQuickPrint: (table: Table) => void;
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  order,
  onClick,
  onQuickAdd,
  onQuickPrint
}) => {
  // Calculate elapsed time if table is opened
  const getElapsedMinutes = () => {
    if (!table.openedAt) return null;
    const diffMs = Date.now() - new Date(table.openedAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h${remMins > 0 ? ` ${remMins}m` : ''}`;
  };

  const elapsed = getElapsedMinutes();

  const statusConfig = {
    livre: {
      label: 'Livre',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cardBg: 'bg-white border-stone-200 hover:border-emerald-300 hover:shadow-md',
      dotColor: 'bg-emerald-500'
    },
    ocupada: {
      label: 'Ocupada',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      cardBg: 'bg-amber-50/40 border-amber-300 shadow-xs hover:border-amber-400 hover:shadow-md',
      dotColor: 'bg-amber-500'
    },
    aguardando_conta: {
      label: 'Pediu a Conta',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse',
      cardBg: 'bg-indigo-50/50 border-indigo-300 shadow-xs hover:border-indigo-400 hover:shadow-md',
      dotColor: 'bg-indigo-600'
    }
  };

  const currentStatus = statusConfig[table.status] || statusConfig.livre;
  const itemsCount = order?.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const unprintedCount = table.unprintedCount || 0;

  return (
    <div
      id={`table-card-${table.number}`}
      onClick={() => onClick(table)}
      className={`relative rounded-2xl border transition-all duration-200 cursor-pointer p-4 flex flex-col justify-between select-none ${currentStatus.cardBg}`}
    >
      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-stone-900">
              {table.name}
            </span>
            <span className={`w-2.5 h-2.5 rounded-full ${currentStatus.dotColor}`} />
          </div>

          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${currentStatus.badgeBg}`}>
            {currentStatus.label}
          </span>
        </div>

        {/* Content for occupied tables */}
        {table.status !== 'livre' ? (
          <div className="space-y-1.5 my-2">
            <div className="flex items-center justify-between text-xs text-stone-600">
              {table.waiterName && (
                <span className="flex items-center gap-1 font-medium truncate max-w-[130px]" title={table.waiterName}>
                  <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  {table.waiterName}
                </span>
              )}
              {elapsed && (
                <span className="flex items-center gap-1 text-stone-500 text-[11px] ml-auto shrink-0">
                  <Clock className="w-3 h-3 text-stone-400" />
                  {elapsed}
                </span>
              )}
            </div>

            {table.customerName && (
              <div className="text-xs text-stone-700 font-medium truncate bg-white/70 px-2 py-0.5 rounded border border-stone-200/60">
                Cliente: <span className="font-semibold text-stone-900">{table.customerName}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-stone-500 font-medium">
                {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
              </span>
              <span className="text-base font-extrabold text-stone-900">
                R$ {(table.total || 0).toFixed(2)}
              </span>
            </div>

            {/* Unprinted kitchen ticket warning */}
            {unprintedCount > 0 && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickPrint(table);
                }}
                className="mt-2 flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                title="Clique para imprimir comanda para cozinha"
              >
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-bounce" />
                  <span>{unprintedCount} novos na cozinha</span>
                </div>
                <Receipt className="w-3.5 h-3.5 text-rose-600" />
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-stone-600 font-medium">Mesa desocupada</p>
            <p className="text-[11px] text-stone-500">Toque para abrir comanda</p>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-stone-200/70 flex items-center justify-between gap-1 mt-1">
        {table.status === 'livre' ? (
          <button
            type="button"
            id={`btn-open-table-${table.number}`}
            onClick={(e) => {
              e.stopPropagation();
              onClick(table);
            }}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Abrir Mesa</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center justify-between w-full gap-2">
            <button
              type="button"
              id={`btn-add-item-${table.number}`}
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(table);
              }}
              className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800 flex items-center justify-center gap-1 transition-colors"
              title="Adicionar itens"
            >
              <UtensilsCrossed className="w-3 h-3" />
              <span>+ Itens</span>
            </button>

            <button
              type="button"
              id={`btn-print-table-${table.number}`}
              onClick={(e) => {
                e.stopPropagation();
                onQuickPrint(table);
              }}
              className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center justify-center gap-1 transition-colors"
              title="Imprimir comanda térmica"
            >
              <Receipt className="w-3 h-3" />
              <span>Imprimir</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
