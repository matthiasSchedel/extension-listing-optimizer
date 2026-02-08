import path from 'node:path';

import cors from 'cors';
import express from 'express';

import { analyzeRouter } from './routes/analyze';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use('/api', analyzeRouter);

  const clientPath = path.resolve(__dirname, '..');
  app.use(express.static(clientPath));

  app.get('*', (_req, res) => {
    const indexPath = path.join(clientPath, 'index.html');
    res.sendFile(indexPath, (error) => {
      if (error) {
        res.status(404).json({ error: 'Frontend build not found.' });
      }
    });
  });

  return app;
}

if (process.env.VITEST !== 'true') {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}
