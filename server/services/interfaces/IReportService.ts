import type { SalesReport } from '../../../src/types.ts';

export interface IReportService {
  generateSalesReport(): SalesReport;
}
