import { createBaseApp } from '../server/app.ts';

const { app } = createBaseApp();

// Vercel Serverless Function entry point:
// Exporting the Express app directly allows @vercel/node to handle the HTTP bridge seamlessly.
export default app;
export { app };
