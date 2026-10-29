import type { Request, Response } from 'express';
import { createBaseApp } from '../server/app.ts';

const { app } = createBaseApp();

/**
 * Standard Vercel Serverless Function entry point.
 * Wraps the Express application with error containment to prevent unhandled process crashes.
 */
export default function handler(req: Request, res: Response) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('Fatal unhandled error in serverless handler:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Erro interno na função do servidor',
        message: err?.message || String(err)
      });
    }
  }
}

export { app };

