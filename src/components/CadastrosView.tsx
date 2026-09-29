import React, { useState, useEffect } from 'react';
import { 
  Package, 
  UtensilsCrossed, 
  Users, 
  Plus, 
  Search, 
  Edit, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  History,
  TrendingUp,
  Wine,
  Tag
} from 'lucide-react';
import type { Product, StockMovement, Table, ProductCategory } from '../types';
import { CurrencyInput } from './CurrencyInput';
import { StockManager } from './StockManager';

interface CadastrosViewProps {
  products: Product[];
  stockMovements: StockMovement[];
  tables: Table[];
  initialSubTab?: 'produtos' | 'mesas' | 'estoque' | 'equipe';
  currentUserRole?: string;
  onAddProduct: (product: Partial<Product>) => Promise<void>;
  onUpdateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  onAdjustStock: (productId: string, delta: number, reason: string, type: string) => Promise<void>;
  onAddTable?: (name: string, capacity: number) => void;
}

export const CadastrosView: React.FC<CadastrosViewProps> = ({
  products,
  stockMovements,
  tables,
  initialSubTab = 'produtos',
  currentUserRole = 'admin',
  onAddProduct,
  onUpdateProduct,
  onAdjustStock,
  onAddTable
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'produtos' | 'mesas' | 'estoque' | 'equipe'>(initialSubTab);
  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // New table modal state
  const [showTableModal, setShowTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState(`Mesa ${tables.length + 1}`);
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddTable) {
      onAddTable(newTableName, newTableCapacity);
    }
    setShowTableModal(false);
    setNewTableName(`Mesa ${tables.length + 2}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-600" />
            <span>Cadastros do Sistema</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Gerenciamento central de cardápio, produtos, mesas do salão, estoque e operadores
          </p>
        </div>

        {/* Subtab Buttons */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-bold overflow-x-auto max-w-full">
          <button
            type="button"
            id="subtab-produtos"
            onClick={() => setActiveSubTab('produtos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'produtos' 
                ? 'bg-white text-stone-950 shadow-xs font-black' 
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Wine className="w-3.5 h-3.5 text-amber-600" />
            <span>Cardápio & Produtos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700">
              {products.length}
            </span>
          </button>

          <button
            type="button"
            id="subtab-mesas"
            onClick={() => setActiveSubTab('mesas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'mesas' 
                ? 'bg-white text-stone-950 shadow-xs font-black' 
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mesas do Salão</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700">
              {tables.length}
            </span>
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                id="subtab-estoque"
                onClick={() => setActiveSubTab('estoque')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'estoque' 
                    ? 'bg-white text-stone-950 shadow-xs font-black' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span>Estoque & Entradas</span>
              </button>

              <button
                type="button"
                id="subtab-equipe"
                onClick={() => setActiveSubTab('equipe')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'equipe' 
                    ? 'bg-white text-stone-950 shadow-xs font-black' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-stone-600" />
                <span>Equipe & Garçons</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Subtab 1: Cardapio & Produtos */}
      {activeSubTab === 'produtos' && (
        <StockManager
          products={products}
          stockMovements={stockMovements}
          mode="products"
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onAdjustStock={onAdjustStock}
        />
      )}

      {/* Subtab 3: Estoque & Movimentações */}
      {activeSubTab === 'estoque' && (
        <StockManager
          products={products}
          stockMovements={stockMovements}
          mode="stock"
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onAdjustStock={onAdjustStock}
        />
      )}

      {/* Subtab 2: Mesas do Salão */}
      {activeSubTab === 'mesas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900">Configuração de Mesas do Salão</h3>
              <p className="text-xs text-stone-500">Capacidade de lugares e numeração das mesas para comandas</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTableModal(true)}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Nova Mesa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map(table => (
              <div 
                key={table.id}
                className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center font-black text-xs">
                      #{table.number}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-stone-900">{table.name}</h4>
                      <span className="text-[11px] text-stone-500">{table.capacity} lugares</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    table.status === 'livre' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : table.status === 'aguardando_conta'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {table.status === 'livre' ? 'Livre' : table.status === 'aguardando_conta' ? 'Pediu Conta' : 'Ocupada'}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span>Garçom: {table.waiterName || '-'}</span>
                  <span>Clientes: {table.guestsCount || 0}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal to add table */}
          {showTableModal && (
            <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-stone-900">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                  <h3 className="font-extrabold text-base">Nova Mesa no Salão</h3>
                  <button 
                    type="button" 
                    onClick={() => setShowTableModal(false)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateTable} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Nome / Identificação da Mesa</label>
                    <input
                      type="text"
                      required
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Capacidade de Lugares</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      required
                      value={newTableCapacity}
                      onChange={(e) => setNewTableCapacity(parseInt(e.target.value, 10) || 4)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTableModal(false)}
                      className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs shadow-xs"
                    >
                      Salvar Mesa
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtab 4: Equipe & Garçons */}
      {activeSubTab === 'equipe' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-700" />
              <span>Operadores e Garçons Cadastrados</span>
            </h3>
            <p className="text-xs text-stone-500">
              Perfis de acesso ao sistema do bar e comandas dos garçons
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[
                { name: 'Gerente / Administrador', role: 'admin', desc: 'Acesso total a relatórios, configurações e segurança' },
                { name: 'Operador de Caixa', role: 'caixa', desc: 'Abertura e fechamento de contas, emissão de comprovantes' },
                { name: 'Garçons (App Mobile)', role: 'garcom', desc: 'Lançamento de pedidos em tempo real nas mesas pelo celular' }
              ].map(op => (
                <div key={op.role} className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-stone-900">{op.name}</span>
                    <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      {op.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">{op.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
