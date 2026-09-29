import type { Request, Response } from 'express';
import type { IPrinterConfigRepository } from '../repositories/interfaces/IPrinterConfigRepository.ts';
import type { IEventPublisher } from '../services/interfaces/IEventNotificationService.ts';

/**
 * Single Responsibility: Handling HTTP endpoints for Thermal Printer Settings.
 * Dependency Inversion: Receives IPrinterConfigRepository & IEventPublisher.
 */
export class PrinterController {
  constructor(
    private printerRepo: IPrinterConfigRepository,
    private eventPublisher?: IEventPublisher
  ) {}

  getConfig = (_req: Request, res: Response) => {
    const config = this.printerRepo.getConfig();
    return res.json(config);
  };

  updateConfig = (req: Request, res: Response) => {
    const updated = this.printerRepo.updateConfig(req.body);
    this.eventPublisher?.broadcast('PRINTER_CONFIG_UPDATED', { printerConfig: updated });
    return res.json(updated);
  };
}
