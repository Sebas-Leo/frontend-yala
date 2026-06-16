import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Yala frontend — Vite + React. The design-system bundle is loaded at runtime
// from src/ds (see src/ds/load.js), tokens via src/ds/styles.css.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    // Dev proxy: the browser calls same-origin /api, Vite forwards it to the
    // Spring Boot backend on :8081 (openapi profile). Avoids CORS in dev.
    proxy: {
      '/api': 'http://localhost:8081',
    },
  },
});
