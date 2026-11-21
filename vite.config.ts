import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/katex')) {
            return 'katex-vendor';
          }
          if (id.includes('node_modules/@codemirror') || id.includes('node_modules/@uiw')) {
            return 'codemirror-vendor';
          }
          if (id.includes('/components/Figures/')) {
            return 'figures';
          }
          if (id.includes('/components/Verifiers/')) {
            return 'verifiers';
          }
          if (id.includes('/data/')) {
            return 'lectures-data';
          }
          return undefined;
        },
      },
    },
  },
});
