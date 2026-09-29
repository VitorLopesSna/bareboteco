import React, { useState } from 'react';
import { Printer, Copy, Check, Download, X, Eye } from 'lucide-react';
import type { Order, PrinterConfig } from '../types';
import { ReceiptFormatterRegistry } from '../services/receipt/ReceiptFormatters';

interface ThermalReceiptProps {
  order: Order;
  type: 'kitchen' | 'bill' | 'payment_receipt';
  config: PrinterConfig;
  onClose?: () => void;
  onPrinted?: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  order,
  type,
  config,
  onClose,
  onPrinted
}) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(config.paperWidth || '80mm');
  const [copied, setCopied] = useState(false);

  // Filter items if kitchen type: prefer unprinted or all items if none unprinted
  const itemsToPrint = type === 'kitchen' 
    ? (order.items.some(i => !i.printedToKitchen) ? order.items.filter(i => !i.printedToKitchen) : order.items)
    : order.items;

  const nowStr = new Date().toLocaleString('pt-BR');
  const dividerChar = paperWidth === '58mm' ? '--------------------------------' : '------------------------------------------------';
  const doubleDivider = paperWidth === '58mm' ? '================================' : '================================================';

  // Generate plain text ESC/POS formatted representation using Strategy Pattern
  const generateEscPosText = () => {
    const formatter = ReceiptFormatterRegistry.get(type);
    return formatter.format(order, config, { paperWidth });
  };

  const handlePrint = () => {
    window.print();
    if (onPrinted) onPrinted();
  };

  const handleCopyRaw = () => {
    const text = generateEscPosText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const text = generateEscPosText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comanda_${order.tableName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 leading-tight">
                {type === 'kitchen' ? 'Imprimir Comanda de Cozinha / Bar' : type === 'bill' ? 'Imprimir Pré-Conta da Mesa' : 'Comprovante de Pagamento'}
              </h3>
              <p className="text-xs text-stone-500">{order.tableName} • {order.items.length} itens</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper selector toggle */}
            <div className="flex items-center bg-stone-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                id="btn-paper-58mm"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded-md transition-all ${paperWidth === '58mm' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}
              >
                58mm
              </button>
              <button
                type="button"
                id="btn-paper-80mm"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded-md transition-all ${paperWidth === '80mm' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}
              >
                80mm
              </button>
            </div>

            {onClose && (
              <button 
                type="button"
                id="btn-close-thermal"
                onClick={onClose} 
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Receipt Visual Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-200/60 flex justify-center items-start">
          {/* Printable Element - This is what prints on thermal paper */}
          <div 
            id="thermal-receipt-printable" 
            className={`bg-white shadow-md border border-stone-300 rounded-sm p-4 font-mono-thermal text-stone-900 transition-all ${
              paperWidth === '58mm' ? 'receipt-58mm w-[260px] text-xs' : 'receipt-80mm w-[340px] text-sm'
            }`}
          >
            {/* Cut indicator header */}
            <div className="text-center text-[10px] text-stone-400 border-b border-dashed border-stone-300 pb-1 mb-2">
              ✂- - - - - - - - - - - - - - - - - - - -✂
            </div>

            {/* Bar Header */}
            <div className="text-center mb-3">
              <div className="font-extrabold text-base tracking-wide uppercase">{config.barName || 'BOTECO & BAR'}</div>
              {config.barAddress && <div className="text-[11px] text-stone-600 leading-tight">{config.barAddress}</div>}
              {config.barPhone && <div className="text-[11px] text-stone-600">Tel: {config.barPhone}</div>}
              {config.barCnpj && <div className="text-[10px] text-stone-500">CNPJ: {config.barCnpj}</div>}
            </div>

            <div className="border-t border-b border-stone-900 border-dashed py-1.5 my-2 text-center font-bold">
              {type === 'kitchen' && '>>> COMANDA COZINHA / BAR <<<'}
              {type === 'bill' && '>>> CONFERÊNCIA DE MESA <<<'}
              {type === 'payment_receipt' && '>>> COMPROVANTE PAGAMENTO <<<'}
            </div>

            <div className="text-xs space-y-0.5 mb-2">
              <div className="flex justify-between font-bold text-sm">
                <span>{order.tableName}</span>
                <span>#{order.id.slice(-4)}</span>
              </div>
              <div className="text-stone-600 text-[11px]">{nowStr}</div>
              {order.waiterName && <div className="text-stone-700">Garçom: <span className="font-semibold">{order.waiterName}</span></div>}
              {order.customerName && <div className="text-stone-700">Cliente: <span className="font-semibold">{order.customerName}</span></div>}
            </div>

            {/* Table of items */}
            <div className="border-t border-dashed border-stone-800 pt-1.5 mt-2">
              <div className="flex justify-between text-[11px] font-bold text-stone-700 pb-1 border-b border-dashed border-stone-300 mb-1">
                <span>QTD ITEM</span>
                <span>VALOR</span>
              </div>

              <div className="space-y-1.5 my-2">
                {itemsToPrint.map((item, idx) => (
                  <div key={item.id || idx} className="text-xs">
                    <div className="flex justify-between items-start font-medium">
                      <span className="font-bold pr-2">{item.quantity}x {item.name}</span>
                      <span className="whitespace-nowrap font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    {item.notes && (
                      <div className="bg-stone-100 text-stone-800 px-1 py-0.5 rounded text-[11px] font-semibold mt-0.5 border-l-2 border-amber-500 pl-1.5">
                        OBS: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Section */}
            {type !== 'kitchen' ? (
              <div className="border-t border-dashed border-stone-900 pt-2 mt-2 space-y-1 text-xs">
                <div className="flex justify-between text-stone-700">
                  <span>Subtotal:</span>
                  <span>R$ {order.subtotal.toFixed(2)}</span>
                </div>
                {order.serviceTaxAmount > 0 && (
                  <div className="flex justify-between text-stone-700">
                    <span>Taxa Serviço ({order.serviceTaxPercent}%):</span>
                    <span>R$ {order.serviceTaxAmount.toFixed(2)}</span>
                  </div>
                )}
                {order.discount && order.discount > 0 ? (
                  <div className="flex justify-between text-emerald-700">
                    <span>Desconto:</span>
                    <span>- R$ {order.discount.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="border-t border-stone-900 border-double pt-1 flex justify-between font-extrabold text-sm text-stone-900">
                  <span>TOTAL A PAGAR:</span>
                  <span>R$ {order.total.toFixed(2)}</span>
                </div>
                {order.paymentMethod && (
                  <div className="text-[11px] font-bold text-stone-700 pt-1">
                    Forma: {order.paymentMethod.toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              <div className="border-t border-dashed border-stone-900 pt-2 mt-2 text-xs font-bold text-center">
                TOTAL DE ITENS: {itemsToPrint.reduce((acc, i) => acc + i.quantity, 0)}
              </div>
            )}

            {/* Footer message */}
            <div className="border-t border-dashed border-stone-300 pt-2 mt-3 text-center text-[10px] text-stone-600">
              {config.footerMessage || 'Obrigado pela preferência!'}
              <div className="text-[9px] text-stone-400 mt-1 font-sans">Sistema Boteco & Bar</div>
            </div>

            {/* Bottom cut indicator */}
            <div className="text-center text-[10px] text-stone-400 border-t border-dashed border-stone-300 pt-1 mt-2">
              ✂- - - - - - - - - - - - - - - - - - - -✂
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-copy-raw-escpos"
              onClick={handleCopyRaw}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors shadow-xs"
              title="Copiar texto para impressoras Bluetooth / ESC-POS"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar ESC/POS'}</span>
            </button>

            <button
              type="button"
              id="btn-download-txt-comanda"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors shadow-xs"
              title="Baixar arquivo TXT"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar TXT</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                id="btn-cancel-print"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-200 transition-colors"
              >
                Fechar
              </button>
            )}

            <button
              type="button"
              id="btn-confirm-print"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Térmica ({paperWidth})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
