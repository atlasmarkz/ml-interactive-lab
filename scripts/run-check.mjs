// Loads scripts/check-content.ts through Vite's SSR loader so it can import the TS data files directly.
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
});
try {
  await server.ssrLoadModule('/scripts/check-content.ts');
} finally {
  await server.close();
}
