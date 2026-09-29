import type { PrinterConfig } from '../../../src/types.ts';
import type { IPrinterConfigRepository } from '../interfaces/IPrinterConfigRepository.ts';

/**
 * Single Responsibility: Management of printer configuration state.
 * Liskov Substitution: Satisfies IPrinterConfigRepository contract.
 */
export class InMemoryPrinterConfigRepository implements IPrinterConfigRepository {
  private config: PrinterConfig;

  constructor(initialConfig: PrinterConfig) {
    this.config = { ...initialConfig };
  }

  getConfig(): PrinterConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<PrinterConfig>): PrinterConfig {
    this.config = { ...this.config, ...partial };
    return { ...this.config };
  }
}
