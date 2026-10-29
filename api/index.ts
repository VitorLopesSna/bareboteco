import { createBaseApp } from '../server/app.ts';

const { app } = createBaseApp();

// Comprehensive Vercel Serverless Handler
export default function handler(req: any, res: any) {
  return new Promise((resolve) => {
    try {
      res.on('finish', () => resolve(null));
      res.on('close', () => resolve(null));
      res.on('error', (err: any) => {
        console.error('Response stream error:', err);
        resolve(null);
      });

      // Handle Vercel URL rewrite headers so all /api endpoints match Express routes
      const rawHeader = req.headers?.['x-vercel-original-url'] ||
        req.headers?.['x-matched-path'] ||
        req.headers?.['x-rewrite-url'];
      const originalUrl = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

      if (typeof originalUrl === 'string' && (req.url === '/api' || req.url === '/api/' || req.url === '/' || req.url === '')) {
        if (originalUrl.startsWith('/api') || originalUrl.startsWith('/')) {
          req.url = originalUrl;
        }
      }

      app(req, res);
    } catch (err: any) {
      console.error('Vercel invocation error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'FUNCTION_INVOCATION_ERROR',
          message: err?.message || 'Server error',
          timestamp: new Date().toISOString()
        });
      }
      resolve(null);
    }
  });
}

// Attach Express instance properties for compatibility
Object.assign(handler, app);
export { app };
