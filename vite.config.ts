import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  ssr: {
    external: ['level', 'classic-level', 'abstract-level'],
    target: 'node',
  },
  optimizeDeps: {
    exclude: ['level', 'classic-level', 'abstract-level'],
  },
  resolve: {
    alias: {
      'level': resolve(__dirname, 'node_modules/level'),
      'classic-level': resolve(__dirname, 'node_modules/classic-level'),
      'abstract-level': resolve(__dirname, 'node_modules/abstract-level'),
    },
  },
  build: {
    rollupOptions: {
      external: ['level', 'classic-level', 'abstract-level']
    }
  }
});
 