import { Router } from 'express';
import type { ServiceContainer } from './container.ts';

/**
 * Single Responsibility: API Route declarations and routing table mapping with security enforcement.
 */
export function createApiRouter(container: ServiceContainer): Router {
  const router = Router();
  const { requireAuth, requireRole } = container.authMiddleware;

  // Security Headers Middleware (Defense-in-depth)
  router.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Public Security overview
  router.get('/security/status', container.securityController.getStatus);
  router.post('/payments/pix/generate', container.securityController.generatePix);

  // Authentication routes (Brute-force protected)
  router.post('/auth/login', container.authController.login);
  router.post('/auth/register', container.authController.register);
  router.get('/auth/me', container.authController.me);
  router.post('/auth/logout', container.authController.logout);

  // User Management (Admin only)
  router.get('/auth/users', requireRole('admin'), container.authController.listUsers);

  // Security Audit Logs (Admin only)
  router.get('/security/audit-logs', requireRole('admin'), container.securityController.getAuditLogs);

  // SSE Real-Time synchronization
  router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = container.notificationService.registerClient(res);

    req.on('close', () => {
      container.notificationService.unregisterClient(clientId);
    });
  });

  // State hydration
  router.get('/state', (_req, res) => {
    res.json(container.getSnapshotState());
  });

  // Table & Order routes (waiter, cashier, admin)
  router.post('/tables/:id/open', container.tableController.openTable);
  router.post('/tables/:id/add-items', container.tableController.addItems);
  router.post('/tables/:id/mark-printed', container.tableController.markPrinted);
  router.post('/tables/:id/request-bill', container.tableController.requestBill);

  // Checkout (Cashier and Admin role or authenticated staff)
  router.post('/tables/:id/checkout', container.tableController.checkout);

  // Reopen closed order
  router.post('/orders/:id/reopen', container.tableController.reopenOrder);

  // Products & Stock routes
  router.post('/products', container.productController.createProduct);
  router.put('/products/:id', container.productController.updateProduct);
  router.post('/products/:id/adjust-stock', container.productController.adjustStock);

  // Printer configuration routes
  router.get('/printer-config', container.printerController.getConfig);
  router.put('/printer-config', container.printerController.updateConfig);

  // Reports
  router.get('/reports', container.reportController.getReports);

  return router;
}
