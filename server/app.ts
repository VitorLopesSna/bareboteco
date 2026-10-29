import express from 'express';
import { ServiceContainer } from './container.ts';
import { createApiRouter } from './routes.ts';

export function createBaseApp() {
  const app = express();

  // JSON Body Parser
  app.use(express.json());

  // CORS & Preflight support for external access and mobile devices
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check for proxy and deployment monitoring
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Dependency Inversion Principle (DIP): Composition Root
  const container = new ServiceContainer();

  // API Routes
  app.use('/api', createApiRouter(container));

  // Centralized JSON Error Handler for /api routes
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      error: typeof err.message === 'string' ? err.message : 'Erro interno do servidor',
      status: err.status || 500
    });
  });

  return { app, container };
}
