import React, { useState, useEffect } from 'react';
import { 
  Wine, 
  LayoutDashboard,
  UtensilsCrossed, 
  Package, 
  FolderTree,
  BarChart3, 
  Printer, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  Radio, 
  QrCode, 
  X, 
  Check, 
  Copy,
  ExternalLink,
  User as UserIcon,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  currentTab: 'dashboard' | 'tables' | 'cadastros' | 'stock' | 'reports' | 'waiter_mode';
  onSelectTab: (tab: 'dashboard' | 'tables' | 'cadastros' | 'reports' | 'waiter_mode') => void;
  occupiedCount: number;
  totalTables: number;
  lowStockCount: number;
  unprintedCount: number;
  sseConnected: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenPrinterSettings: () => void;
  onOpenSecurityShield?: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
  showQrModalDirect?: boolean;
  onCloseQrModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  occupiedCount,
  totalTables,
  lowStockCount,
  unprintedCount,
  sseConnected,
  soundEnabled,
  onToggleSound,
  onOpenPrinterSettings,
  onOpenSecurityShield,
  currentUser,
  onLogout,
  showQrModalDirect,
  onCloseQrModal
}) => {
  const [time, setTime] = useState(new Date());
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (showQrModalDirect !== undefined) {
      setShowQrModal(showQrModalDirect);
    }
  }, [showQrModalDirect]);

  const handleCloseQrModal = () => {
    setShowQrModal(false);
    if (onCloseQrModal) onCloseQrModal();
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rawOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  // Convert internal dev container URL (ais-dev-) to public share URL (ais-pre-) for smartphones and external devices
  const cleanOrigin = rawOrigin.replace('ais-dev-', 'ais-pre-');
  const waiterAppUrl = cleanOrigin ? `${cleanOrigin}?mode=garcom` : '';
  const qrCodeImageUrl = waiterAppUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(waiterAppUrl)}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(waiterAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const userRole = currentUser?.role || 'admin';
  const isGarcom = userRole === 'garcom';
  const isCaixa = userRole === 'caixa';
  const isAdmin = userRole === 'admin';

  return (
    <>
      <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm">
              <Wine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-white leading-none">
                  Boteco & Bar
                </h1>
                <span className={`hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                  isGarcom 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : isCaixa 
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {isGarcom ? 'Operação Garçom' : isCaixa ? 'Operação Caixa' : 'Gestão & Comandas'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-400 mt-1">
                <span>{time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-400 shadow-xs shadow-emerald-400' : 'bg-rose-500 animate-ping'}`} />
                  <span className="text-[11px] font-medium hidden md:inline">{sseConnected ? 'Tempo Real Ativo' : 'Reconectando...'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links for Main Tabs (Desktop / Tablets >= md) - Filtered by role */}
          <div className="hidden md:flex items-center gap-1 bg-stone-800/80 p-1 rounded-xl border border-stone-700/60">
            {/* 1. Dashboard (Shown for Admin and Caixa) */}
            {!isGarcom && (
              <button
                type="button"
                id="tab-btn-dashboard"
                onClick={() => onSelectTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  currentTab === 'dashboard'
                    ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{isCaixa ? 'Painel Caixa' : 'Dashboard'}</span>
              </button>
            )}

            {/* 2. Mesas & Salão (Shown for all roles) */}
            <button
              type="button"
              id="tab-btn-tables"
              onClick={() => onSelectTab('tables')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'tables'
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Mesas & Salão</span>
              <span className="lg:hidden">Mesas</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                currentTab === 'tables' ? 'bg-stone-950 text-amber-400' : 'bg-stone-700 text-stone-300'
              }`}>
                {occupiedCount}/{totalTables}
              </span>
              {unprintedCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title={`${unprintedCount} pedidos não impressos`} />
              )}
            </button>

            {/* Garçom Quick Simulator Tab (Only for Garçom) */}
            {isGarcom && (
              <button
                type="button"
                id="tab-btn-waiter-mode"
                onClick={() => onSelectTab('waiter_mode')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  currentTab === 'waiter_mode'
                    ? 'bg-emerald-500 text-stone-950 shadow-xs font-black'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Comanda Rápida Mobile</span>
              </button>
            )}

            {/* 3. Cadastros (Only for Admin) */}
            {isAdmin && (
              <button
                type="button"
                id="tab-btn-cadastros"
                onClick={() => onSelectTab('cadastros')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  currentTab === 'cadastros' || currentTab === 'stock'
                    ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Cadastros</span>
                {lowStockCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-rose-500 text-white">
                    {lowStockCount}
                  </span>
                )}
              </button>
            )}

            {/* 4. Vendas & Caixa (Shown for Admin and Caixa) */}
            {!isGarcom && (
              <button
                type="button"
                id="tab-btn-reports"
                onClick={() => onSelectTab('reports')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  currentTab === 'reports'
                    ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                    : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{isCaixa ? 'Fechamento & Caixa' : 'Vendas & Caixa'}</span>
                <span className="lg:hidden">Caixa</span>
              </button>
            )}
          </div>

          {/* Right Actions: Compact, Cohesive and Filtered by Role */}
          <div className="flex items-center gap-2 shrink-0">
            {/* App Garçom button: Admin shows QR code to staff; Garçom toggles view directly; Caixa does not need it */}
            {isAdmin && (
              <button
                type="button"
                id="btn-switch-waiter-mode"
                onClick={() => setShowQrModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all cursor-pointer"
                title="Conectar Smartphones dos Garçons (QR Code e Link)"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="hidden xl:inline">App Garçom</span>
              </button>
            )}

            {isGarcom && (
              <button
                type="button"
                id="btn-switch-waiter-toggle"
                onClick={() => onSelectTab(currentTab === 'waiter_mode' ? 'tables' : 'waiter_mode')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  currentTab === 'waiter_mode'
                    ? 'bg-emerald-500 text-stone-950 border-emerald-400'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                }`}
                title="Alternar entre Salão de Mesas e Modo Garçom Rápido"
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">{currentTab === 'waiter_mode' ? 'Ver Salão' : 'Modo Comanda'}</span>
              </button>
            )}

            {/* Utilities Pill: Impressora, Segurança Ativa, Som */}
            <div className="flex items-center bg-stone-800 p-1 rounded-xl border border-stone-700/80 gap-0.5">
              {/* Impressora: Visible for Admin and Caixa only */}
              {!isGarcom && (
                <button
                  type="button"
                  id="btn-printer-config"
                  onClick={onOpenPrinterSettings}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer"
                  title="Configurações da Impressora Térmica"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}

              {/* Segurança Ativa: Visible for Admin only */}
              {isAdmin && onOpenSecurityShield && (
                <button
                  type="button"
                  id="btn-security-shield"
                  onClick={onOpenSecurityShield}
                  className="relative p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 transition-colors cursor-pointer"
                  title="Segurança Ativa: PCI-DSS, PIX & Anti-Brute-Force"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-stone-800" />
                </button>
              )}

              {/* Som: Available for all roles */}
              <button
                type="button"
                onClick={onToggleSound}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  soundEnabled 
                    ? 'text-amber-400 hover:bg-stone-700' 
                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-700'
                }`}
                title={soundEnabled ? 'Som ativado para novos pedidos' : 'Som desativado'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* User Profile & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-stone-800">
                <div className="hidden lg:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-stone-200 truncate max-w-[120px] leading-tight">
                    {currentUser.name}
                  </span>
                  <span className={`text-[10px] uppercase font-bold ${
                    isGarcom ? 'text-emerald-400' : isCaixa ? 'text-sky-400' : 'text-amber-400'
                  }`}>
                    {isGarcom ? 'Garçom' : isCaixa ? 'Operador de Caixa' : 'Gerente'}
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-logout"
                  onClick={onLogout}
                  className="p-1.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-stone-800/80 transition-all cursor-pointer"
                  title="Sair do Sistema"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Screens < md) - Role-tailored */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 py-1.5 px-3 flex items-center justify-around shadow-2xl safe-area-bottom">
        {/* For Garçom: Only Mesas and Comanda Rápida */}
        {isGarcom ? (
          <>
            <button
              type="button"
              onClick={() => onSelectTab('tables')}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                currentTab === 'tables'
                  ? 'text-emerald-400 font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">Salão de Mesas</span>
              <span className={`absolute top-0.5 right-6 text-[9px] px-1 py-0.2 rounded-full font-black ${
                currentTab === 'tables' ? 'bg-emerald-400 text-stone-950' : 'bg-stone-700 text-stone-300'
              }`}>
                {occupiedCount}/{totalTables}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('waiter_mode')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                currentTab === 'waiter_mode'
                  ? 'text-emerald-400 font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Smartphone className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">Comanda Rápida</span>
            </button>
          </>
        ) : isCaixa ? (
          /* For Caixa: Dashboard, Mesas, Vendas/Caixa */
          <>
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                currentTab === 'dashboard'
                  ? 'text-sky-400 font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">Painel Caixa</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('tables')}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                currentTab === 'tables'
                  ? 'text-sky-400 font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">Mesas</span>
              <span className={`absolute top-0.5 right-4 text-[9px] px-1 py-0.2 rounded-full font-black ${
                currentTab === 'tables' ? 'bg-sky-400 text-stone-950' : 'bg-stone-700 text-stone-300'
              }`}>
                {occupiedCount}/{totalTables}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('reports')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                currentTab === 'reports'
                  ? 'text-sky-400 font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">Caixa & Fechamento</span>
            </button>
          </>
        ) : (
          /* For Admin: Full 4 tabs */
          <>
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                currentTab === 'dashboard'
                  ? 'text-amber-400 font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('tables')}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                currentTab === 'tables'
                  ? 'text-amber-400 font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">Mesas</span>
              <span className={`absolute top-0.5 right-4 text-[9px] px-1 py-0.2 rounded-full font-black ${
                currentTab === 'tables' ? 'bg-amber-400 text-stone-950' : 'bg-stone-700 text-stone-300'
              }`}>
                {occupiedCount}/{totalTables}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('cadastros')}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                currentTab === 'cadastros' || currentTab === 'stock'
                  ? 'text-amber-400 font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <FolderTree className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">Cadastros</span>
              {lowStockCount > 0 && (
                <span className="absolute top-0.5 right-4 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('reports')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                currentTab === 'reports'
                  ? 'text-amber-400 font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">Vendas</span>
            </button>
          </>
        )}
      </nav>

      {/* QR Code & Mobile Connection Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-stone-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base">App dos Garçons</h3>
              </div>
              <button 
                type="button" 
                onClick={handleCloseQrModal}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Abra este link ou aponte a câmera do celular de qualquer garçom na rede do bar para lançar pedidos em tempo real sincronizados com o caixa!
            </p>

            {/* Real scannable QR Code image */}
            <div className="bg-stone-100 p-3 rounded-xl border border-stone-200 flex flex-col items-center justify-center mb-3">
              <div className="w-44 h-44 bg-white p-2 rounded-lg border border-stone-300 flex items-center justify-center shadow-xs">
                {qrCodeImageUrl ? (
                  <img
                    src={qrCodeImageUrl}
                    alt="QR Code App Garçom"
                    className="w-40 h-40 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <QrCode className="w-36 h-36 text-stone-900" />
                )}
              </div>
              <span className="text-[11px] font-bold text-stone-600 mt-2">
                Escaneie com a câmera do celular
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wide">
                Link Direto para Smartphone:
              </label>
              <div className="flex items-center gap-1.5 bg-stone-50 p-2 rounded-lg border border-stone-200 text-xs">
                <input
                  type="text"
                  readOnly
                  value={waiterAppUrl}
                  className="bg-transparent flex-1 text-stone-700 outline-none truncate text-[11px] font-mono select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded font-bold text-[10px] shrink-0 transition-colors flex items-center gap-1"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Informative notice about Google Redirect Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-900 leading-tight">
                <p className="font-bold mb-0.5">ℹ️ Sobre o "Aviso de Redirecionamento":</p>
                <p>
                  Se o seu navegador ou mensageiro exibir uma tela do Google informando <em>"Aviso de redirecionamento"</em>, basta clicar no link azul para prosseguir, ou colar o link diretamente na barra de navegação do seu navegador (Chrome/Safari).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowQrModal(false);
                  onSelectTab('waiter_mode');
                }}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Testar Modo Garçom Nesta Tela</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
