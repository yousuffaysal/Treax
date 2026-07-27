import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // `server-only` throws on import by design; that guard is meaningless in
      // a Node test runner, so it is stubbed out here. See the stub for detail.
      'server-only': path.resolve(__dirname, './test/server-only-stub.ts'),
    },
  },
});
