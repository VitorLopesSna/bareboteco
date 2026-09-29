import type { PrinterConfig } from '../../../src/types.ts';

export interface IPrinterConfigRepository {
  getConfig(): PrinterConfig;
  updateConfig(partial: Partial<PrinterConfig>): PrinterConfig;
}
