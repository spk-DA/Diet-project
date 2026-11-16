import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { env } from './server/config/env.ts';
import { initRepository } from './server/db/repository.ts';
import apiRouter from './server/routes/index.ts';

async function startServer() {
  await initRepository();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Mount REST API
  app.use('/api', apiRouter);

  // Unknown API routes return clean JSON 404
  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'API endpoint not found.' });
  });

  if (env.nodeEnv !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`FreshBowl server listening on http://0.0.0.0:${env.port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start FreshBowl server:', err);
  process.exit(1);
});
