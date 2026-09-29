import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { ServiceContainer } from './server/container.ts';
import { createApiRouter } from './server/routes.ts';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json());

  // Health check for proxy and deployment monitoring
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Dependency Inversion Principle (DIP): Composition Root
  const container = new ServiceContainer();

  // API Routes
  app.use('/api', createApiRouter(container));

  // Vite middleware for development / Static file server for production
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicit fallback for client SPA navigation and direct URL reloads
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        const template = await vite.transformIndexHtml(req.originalUrl, indexHtml);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
