import React, { useState } from 'react';
import { Printer, X, CheckCircle, Sliders, FileText } from 'lucide-react';
import type { PrinterConfig } from '../types';

interface PrinterSettingsModalProps {
  config: PrinterConfig;
  onClose: () => void;
  onSave: (config: Partial<PrinterConfig>) => Promise<void>;
  onTestPrint: () => void;
}

export const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({
  config,
  onClose,
  onSave,
  onTestPrint
}) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(config.paperWidth);
  const [barName, setBarName] = useState(config.barName);
  const [barAddress, setBarAddress] = useState(config.barAddress);
  const [barPhone, setBarPhone] = useState(config.barPhone);
  const [barCnpj, setBarCnpj] = useState(config.barCnpj);
  const [footerMessage, setFooterMessage] = useState(config.footerMessage);
  const [defaultServiceTax, setDefaultServiceTax] = useState(config.defaultServiceTax || 10);
  const [autoPrintKitchen, setAutoPrintKitchen] = useState(config.autoPrintKitchen ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        paperWidth,
        barName,
        barAddress,
        barPhone,
        barCnpj,
        footerMessage,
        defaultServiceTax,
        autoPrintKitchen
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-stone-900">
              Configurações da Impressora Térmica
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paper Width Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Largura da Bobina Térmica
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  paperWidth === '58mm'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span className="text-sm font-black">58 mm (Mini / Bluetooth)</span>
                <span className="text-[11px] text-stone-500 mt-1">Impressoras portáteis ou compactas (ex: Sunmi, POS-58, Goojprt)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  paperWidth === '80mm'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span className="text-sm font-black">80 mm (Padrão Balcão)</span>
                <span className="text-[11px] text-stone-500 mt-1">Impressoras fixas de balcão (ex: Elgin i9, Bematech MP4200, Epson TM-T20)</span>
              </button>
            </div>
          </div>

          {/* Bar Info for Slip Header */}
          <div className="space-y-3 pt-2 border-t border-stone-200">
            <h4 className="text-xs font-bold text-stone-900">Cabeçalho do Cupom / Comanda</h4>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">Nome do Estabelecimento</label>
              <input
                type="text"
                required
                value={barName}
                onChange={(e) => setBarName(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={barPhone}
                  onChange={(e) => setBarPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">CNPJ (Opcional)</label>
                <input
                  type="text"
                  value={barCnpj}
                  onChange={(e) => setBarCnpj(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={barAddress}
                onChange={(e) => setBarAddress(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">Mensagem de Rodapé</label>
              <input
                type="text"
                value={footerMessage}
                onChange={(e) => setFooterMessage(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="pt-2 border-t border-stone-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
              <input
                type="checkbox"
                checked={autoPrintKitchen}
                onChange={(e) => setAutoPrintKitchen(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Alertar para impressão imediata ao receber novos pedidos de garçons</span>
            </label>
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onTestPrint}
              className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Imprimir Cupom de Teste</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Preferências'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
