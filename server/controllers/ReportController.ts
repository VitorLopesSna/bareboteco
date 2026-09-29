import type { Request, Response } from 'express';
import type { IReportService } from '../services/interfaces/IReportService.ts';

/**
 * Single Responsibility: Handling HTTP endpoints for Sales and Financial Reports.
 * Dependency Inversion: Receives IReportService.
 */
export class ReportController {
  constructor(private reportService: IReportService) {}

  getReports = (_req: Request, res: Response) => {
    const report = this.reportService.generateSalesReport();
    return res.json(report);
  };
}
