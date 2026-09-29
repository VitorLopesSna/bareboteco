import React, { useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Edit, 
  History, 
  TrendingUp, 
  CheckCircle2, 
  X,
  Filter
} from 'lucide-react';
import type { Product, StockMovement, ProductCategory } from '../types';
import { CurrencyInput } from './CurrencyInput';

interface StockManagerProps {
  products: Product[];
  stockMovements: StockMovement[];
  mode?: 'products' | 'stock' | 'both';
  onAddProduct: (product: Partial<Product>) => Promise<void>;
  onUpdateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  onAdjustStock: (productId: string, delta: number, reason: string, type: string) => Promise<void>;
}

export const StockManager: React.FC<StockManagerProps> = ({
  products,
  stockMovements,
  mode = 'both',
  onAddProduct,
  onUpdateProduct,
  onAdjustStock
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // New product / edit product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick adjust modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(12);
  const [adjustReason, setAdjustReason] = useState<string>('Reposição de estoque / Compra distribuidora');
  const [adjustType, setAdjustType] = useState<'entrada' | 'perda' | 'ajuste'>('entrada');

  // Form states for add/edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('cervejas');
  const [formPrice, setFormPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('10');
  const [formUnit, setFormUnit] = useState('un');

  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('cervejas');
    setFormPrice('');
    setFormCostPrice('');
    setFormStock('24');
    setFormMinStock('10');
    setFormUnit('un');
    setShowProductModal(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormPrice(String(prod.price));
    setFormCostPrice(String(prod.costPrice));
    setFormStock(String(prod.stock));
    setFormMinStock(String(prod.minStock));
    setFormUnit(prod.unit);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<Product> = {
      name: formName,
      category: formCategory,
      price: Number(formPrice) || 0,
      costPrice: Number(formCostPrice) || 0,
      stock: Number(formStock) || 0,
      minStock: Number(formMinStock) || 5,
      unit: formUnit,
      active: true
    };

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, data);
    } else {
      await onAddProduct(data);
    }
    setShowProductModal(false);
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const delta = adjustType === 'perda' ? -Math.abs(adjustQuantity) : Math.abs(adjustQuantity);
    await onAdjustStock(adjustingProduct.id, delta, adjustReason, adjustType);
    setAdjustingProduct(null);
  };

  // Quick helper
  const handleQuickAdd = async (product: Product, amount: number) => {
    await onAdjustStock(product.id, amount, `Entrada rápida (+${amount} un)`, 'entrada');
  };

  // Calculations
  const lowStockCount = products.filter(p => p.active && p.stock <= p.minStock).length;
  const totalStockValueCost = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  const totalStockValueSale = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    if (showOnlyLowStock && p.stock > p.minStock) return false;
    const matchesCat = selectedCategory === 'todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Inventory Metrics (Shown in stock mode or both) */}
      {mode !== 'products' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total em Catálogo</span>
              <div className="text-2xl font-black text-stone-900 mt-1">{products.length} itens</div>
              <span className="text-xs text-stone-600">Disponíveis no bar</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between transition-all ${
            lowStockCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-stone-200'
          }`}>
            <div>
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Estoque Crítico / Baixo</span>
              <div className="text-2xl font-black text-rose-900 mt-1">{lowStockCount} produtos</div>
              <span className="text-xs text-rose-600">Abaixo do mínimo</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Valor do Estoque (Custo)</span>
              <div className="text-2xl font-black text-stone-900 mt-1">R$ {totalStockValueCost.toFixed(2)}</div>
              <span className="text-xs text-emerald-600 font-semibold">Potencial Venda: R$ {totalStockValueSale.toFixed(2)}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs and Action Bar */}
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 bg-stone-50/60">
          {mode === 'products' ? (
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm">Catálogo de Produtos & Cardápio</h3>
              <p className="text-xs text-stone-500">{products.length} itens cadastrados no menu</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-stone-200/80 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'inventory' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}
              >
                Estoque dos Produtos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'history' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}
              >
                Histórico de Movimentações ({stockMovements.length})
              </button>
            </div>
          )}

          {mode !== 'stock' && (
            <button
              type="button"
              id="btn-new-product"
              onClick={openNewProductModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Produto</span>
            </button>
          )}
        </div>

        {activeTab === 'inventory' ? (
          <div>
            {/* Filters Bar */}
            <div className="p-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-white">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar produto no estoque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Category select */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none"
                >
                  <option value="todos">Todas as Categorias</option>
                  <option value="cervejas">Cervejas</option>
                  <option value="drinks">Drinks</option>
                  <option value="doses">Doses</option>
                  <option value="sem_alcool">Bebidas Sem Álcool</option>
                  <option value="porcoes">Porções</option>
                  <option value="lanches">Lanches</option>
                </select>

                {/* Low stock toggle button */}
                <button
                  type="button"
                  onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    showOnlyLowStock 
                      ? 'bg-rose-100 border-rose-300 text-rose-800' 
                      : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Estoque Baixo ({lowStockCount})</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="px-6 py-3">Produto</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3 text-right">Preço Custo</th>
                    <th className="px-4 py-3 text-right">Preço Venda</th>
                    <th className="px-4 py-3 text-center">Margem</th>
                    <th className="px-4 py-3 text-center">Estoque Atual</th>
                    <th className="px-4 py-3 text-center">Mínimo</th>
                    <th className="px-6 py-3 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map(product => {
                    const isLow = product.stock <= product.minStock;
                    const margin = product.price > 0 
                      ? (((product.price - product.costPrice) / product.price) * 100).toFixed(0) 
                      : '0';

                    return (
                      <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-stone-900">
                          <div className="flex items-center gap-2">
                            <span>{product.name}</span>
                            {isLow && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                                Repor
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold capitalize text-[11px]">
                            {product.category}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right font-medium text-stone-500">
                          R$ {product.costPrice.toFixed(2)}
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold text-stone-900">
                          R$ {product.price.toFixed(2)}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-50 text-emerald-700">
                            {margin}%
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-black text-xs ${
                            isLow ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-900'
                          }`}>
                            {product.stock} {product.unit}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center text-stone-400 font-semibold">
                          {product.minStock} {product.unit}
                        </td>

                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Add buttons */}
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(product, 12)}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-bold text-[11px] transition-colors"
                              title="Adicionar 12 unidades (1 engradado)"
                            >
                              +12
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(product, 24)}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-bold text-[11px] transition-colors"
                              title="Adicionar 24 unidades (1 fardo)"
                            >
                              +24
                            </button>

                            {/* Custom Adjust */}
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustingProduct(product);
                                setAdjustQuantity(10);
                                setAdjustReason('Reposição distribuidora');
                                setAdjustType('entrada');
                              }}
                              className="p-1 text-stone-500 hover:text-amber-700 hover:bg-stone-100 rounded"
                              title="Ajuste detalhado"
                            >
                              <Plus className="w-4 h-4" />
                            </button>

                            {/* Edit product */}
                            <button
                              type="button"
                              onClick={() => openEditProductModal(product)}
                              className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
                              title="Editar produto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Stock Movements History Tab */
          <div className="p-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
              <h4 className="font-bold text-stone-900 text-sm">Registro de Movimentações Recentes</h4>
              <span className="text-xs text-stone-500">{stockMovements.length} registros</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 text-stone-500 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Data / Hora</th>
                    <th className="px-4 py-2.5">Produto</th>
                    <th className="px-4 py-2.5 text-center">Tipo</th>
                    <th className="px-4 py-2.5 text-center">Variação</th>
                    <th className="px-4 py-2.5 text-center">Estoque Resultante</th>
                    <th className="px-4 py-2.5">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {stockMovements.slice().reverse().map(sm => {
                    const isPositive = sm.quantityChange > 0;
                    return (
                      <tr key={sm.id} className="hover:bg-stone-50/60">
                        <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                          {new Date(sm.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 font-bold text-stone-900">{sm.productName}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            sm.type === 'venda' 
                              ? 'bg-amber-100 text-amber-800' 
                              : sm.type === 'entrada' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {sm.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-black">
                          <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                            {isPositive ? `+${sm.quantityChange}` : sm.quantityChange}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-stone-800">{sm.newStock}</td>
                        <td className="px-4 py-3 text-stone-600">{sm.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="text-base font-extrabold text-stone-900">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Chopp Heineken 500ml"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="cervejas">Cervejas</option>
                    <option value="drinks">Drinks</option>
                    <option value="doses">Doses</option>
                    <option value="sem_alcool">Sem Álcool</option>
                    <option value="porcoes">Porções</option>
                    <option value="lanches">Lanches</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Unidade</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="un">un (Unidade)</option>
                    <option value="garrafa">garrafa</option>
                    <option value="lata">lata</option>
                    <option value="dose">dose</option>
                    <option value="porção">porção</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Preço de Custo (R$)</label>
                  <CurrencyInput
                    value={Number(formCostPrice) || 0}
                    onChange={(val) => setFormCostPrice(String(val))}
                    placeholder="R$ 0,00"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Preço de Venda (R$)</label>
                  <CurrencyInput
                    value={Number(formPrice) || 0}
                    onChange={(val) => setFormPrice(String(val))}
                    placeholder="R$ 0,00"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Profit Margin calculation */}
              {Number(formPrice) > 0 && (
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs flex items-center justify-between">
                  <span className="text-stone-600">Lucro Bruto por unidade:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-700">
                      R$ {Math.max(0, (Number(formPrice) || 0) - (Number(formCostPrice) || 0)).toFixed(2)}
                    </span>
                    {Number(formPrice) > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {Math.round(((Number(formPrice) - Number(formCostPrice)) / Number(formPrice)) * 100)}% margem
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Estoque Atual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="24"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Estoque Mínimo (Alerta)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="10"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Stock Adjust Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="text-base font-extrabold text-stone-900">
                Ajustar Estoque: {adjustingProduct.name}
              </h3>
              <button 
                type="button" 
                onClick={() => setAdjustingProduct(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-3.5">
              <div className="p-3 bg-stone-50 rounded-xl text-xs flex justify-between">
                <span className="text-stone-600">Estoque atual:</span>
                <span className="font-bold text-stone-900">{adjustingProduct.stock} {adjustingProduct.unit}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Tipo de Movimento</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                >
                  <option value="entrada">Entrada (Compra / Reposição)</option>
                  <option value="perda">Perda / Avaria / Vencimento</option>
                  <option value="ajuste">Ajuste de Balanço / Inventário</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Motivo / Observação</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                >
                  Confirmar Movimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
