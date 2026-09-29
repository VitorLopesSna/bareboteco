import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Database, 
  CreditCard, 
  QrCode, 
  KeyRound, 
  FileText, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Clock,
  Fingerprint
} from 'lucide-react';
import * as api from '../services/api';

interface SecurityShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: string;
}

export const SecurityShieldModal: React.FC<SecurityShieldModalProps> = ({
  isOpen,
  onClose,
  currentUserRole = 'admin'
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await api.fetchSecurityStatus();
      setSecurityStatus(status);

      if (currentUserRole === 'admin') {
        const logsData = await api.fetchSecurityAuditLogs();
        setAuditLogs(logsData.logs || []);
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar status de segurança');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, currentUserRole]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-stone-900 text-stone-100 rounded-2xl shadow-2xl max-w-3xl w-full border border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-stone-100">Blindagem & Segurança Ativa</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 uppercase tracking-wide">
                  Protegido
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Defesas contra Brute-Force, Integridade de Banco e Pagamentos PCI/PIX
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              title="Atualizar dados de segurança"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950 px-6 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Módulos de Proteção</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Trilha de Auditoria (Logs)</span>
            {auditLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-800 text-stone-300 font-mono">
                {auditLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* 1. Brute Force Protection Card */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-100">Proteção contra Brute-Force no Login</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Ativo (5 tentativas / 180s)
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Bloqueia automaticamente o endereço IP e a conta após 5 tentativas incorretas consecutivas. Inclui contador decrescente em tempo real e desativação preventiva de formulário.
                  </p>
                </div>
              </div>

              {/* 2. Database Protection Card */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0 mt-0.5">
                  <Database className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-100">Segurança & Integridade do Banco de Dados</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      PBKDF2-SHA512
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Senhas protegidas por 100.000 iterações PBKDF2 com Salt criptográfico único por usuário (resistente a ataques de GPU e Rainbow Tables). Gravação em disco atômica com troca segura de arquivo temporário contra corrupção.
                  </p>
                </div>
              </div>

              {/* 3. In-App Payment Security (PIX & Card) */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-100">Segurança de Pagamentos no App (Cartão & PIX)</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      PCI-DSS / EMVCo
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    <strong>Cartões:</strong> Arquitetura tokenizada com zero armazenamento de números completos ou CVV. Prevenção de duplicidade por chave de idempotência.<br/>
                    <strong>PIX:</strong> Padrão oficial do Banco Central com checksum polinomial CRC16 e identificadores End-to-End.
                  </p>
                </div>
              </div>

              {/* 4. Anti-Tampering & RBAC */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0 mt-0.5">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-100">Cálculo Autoritativo & Controle por Perfis (RBAC)</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Autoritativo
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Valores, impostos e descontos são recalculados estritamente pelo servidor. Descontos negativos ou superiores ao subtotal são bloqueados e registrados como violação.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                <span>Registros imutáveis de segurança (Últimos {auditLogs.length} eventos)</span>
                <span className="text-[11px] font-mono">Conformidade PCI-DSS 10.x</span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-xs bg-stone-950 rounded-xl border border-stone-800">
                  Nenhum evento registrado até o momento.
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {auditLogs.map((log, index) => {
                    const isAlert = log.severity === 'security_alert';
                    const isWarn = log.severity === 'warn';

                    return (
                      <div
                        key={log.id || index}
                        className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 transition-colors ${
                          isAlert 
                            ? 'bg-rose-950/40 border-rose-800/60 text-rose-200' 
                            : isWarn
                            ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                            : 'bg-stone-950 border-stone-800 text-stone-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {isAlert ? (
                            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          ) : isWarn ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 font-mono font-bold text-[11px]">
                              <span>{log.type}</span>
                              {log.username && (
                                <span className="text-stone-400">@{log.username}</span>
                              )}
                              {log.ip && (
                                <span className="text-stone-500">[{log.ip}]</span>
                              )}
                            </div>
                            <p className="text-stone-300 text-xs mt-0.5 leading-relaxed">
                              {log.details}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right font-mono text-[10px] text-stone-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-emerald-400 font-semibold">Firewall Lógico & Auditoria Operando</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
