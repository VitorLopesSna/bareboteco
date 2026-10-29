import { createBaseApp } from '../server/app.ts';

const { app } = createBaseApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}

export { app };

