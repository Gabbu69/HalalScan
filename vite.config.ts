import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import express from 'express';

const SERVER_ENV_KEYS = [
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'GEMINI_MODEL'
];

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  SERVER_ENV_KEYS.forEach(key => {
    if (!process.env[key] && env[key]) {
      process.env[key] = env[key];
    }
  });

  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-server',
        configureServer(server) {
          const app = express();
          app.use(express.json({ limit: '50mb' }));

          app.get('/api/health', async (req, res) => {
            try {
              const handler = await server.ssrLoadModule('./api/health.ts');
              await handler.default(req, res);
            } catch (err) {
              console.error(err);
              res.status(500).json({ code: 'LOCAL_API_ERROR', error: 'Internal Server Error' });
            }
          });
          
          app.post('/api/analyze', async (req, res) => {
            try {
              const handler = await server.ssrLoadModule('./api/analyze.ts');
              await handler.default(req, res);
            } catch (err) {
              console.error(err);
              res.status(500).json({ code: 'LOCAL_API_ERROR', error: 'Internal Server Error' });
            }
          });

          app.post('/api/chat', async (req, res) => {
            try {
              const handler = await server.ssrLoadModule('./api/chat.ts');
              await handler.default(req, res);
            } catch (err) {
              console.error(err);
              res.status(500).json({ code: 'LOCAL_API_ERROR', error: 'Internal Server Error' });
            }
          });

          server.middlewares.use(app);
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
