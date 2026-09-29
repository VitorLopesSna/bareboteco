import type { Request, Response } from 'express';
import type { AuditLogger } from '../security/AuditLogger.ts';
import type { PaymentSecurityService } from '../security/PaymentSecurityService.ts';
import type { IPrinterConfigRepository } from '../repositories/interfaces/IPrinterConfigRepository.ts';

/**
 * Single Responsibility: Handling HTTP endpoints for Security Inspection, Audit Trails, and Payment generation.
 */
export class SecurityController {
  constructor(
    private auditLogger: AuditLogger,
    private paymentSecurity: PaymentSecurityService,
    private printerRepo: IPrinterConfigRepository
  ) {}

  getStatus = (_req: Request, res: Response) => {
    return res.json({
      status: 'active',
      shieldActive: true,
      features: {
        bruteForceProtection: {
          enabled: true,
          maxAttempts: 5,
          lockoutDurationSeconds: 180,
          description: 'Bloqueio automático temporário após 5 tentativas incorretas'
        },
        databaseSecurity: {
          encryption: 'PBKDF2-SHA512 com salt aleatório criptográfico (100.000 iterações)',
          integrity: 'Escrita atômica em disco (tmp-swap) com isolamento de diretório',
          protection: 'Higienização anti-injeção e proteção contra Prototype Pollution'
        },
        paymentSecurity: {
          pciDssCompliance: 'Arquitetura tokenizada; nenhum dado sensível de cartão (PAN/CVV) é retido',
          pixCentralBank: 'Padrão oficial BRCode EMVCo com checksum polinomial CRC16 e End-to-End ID',
          idempotency: 'Chaves de idempotência ativas para prevenção de cobrança em duplicidade',
          antiTampering: 'Cálculo de valores autoritativo no servidor (proteção contra alteração client-side)'
        },
        accessControl: {
          rbac: 'Controle de acesso baseado em perfis (Admin, Caixa, Garçom)',
          sessions: 'Tokens criptográficos em memória com expiração segura'
        }
      }
    });
  };

  getAuditLogs = (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const logs = this.auditLogger.getRecentEvents(limit);
    return res.json({ logs });
  };

  generatePix = (req: Request, res: Response) => {
    const { amount, txId } = req.body;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valor inválido para cobrança PIX' });
    }

    const config = this.printerRepo.getConfig();
    const pixData = this.paymentSecurity.generatePixBRCode({
      pixKey: config.barCnpj || '12.345.678/0001-90',
      merchantName: config.barName || 'Boteco e Bar',
      merchantCity: 'Sao Paulo',
      amount: numAmount,
      txId
    });

    return res.json(pixData);
  };
}
