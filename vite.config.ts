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
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'katex-vendor': ['katex'],
          'codemirror-vendor': [
            '@uiw/react-codemirror',
            '@codemirror/lang-python',
            '@codemirror/theme-one-dark',
            '@codemirror/view',
            '@codemirror/state',
          ],
        },
      },
    },
  },
});
