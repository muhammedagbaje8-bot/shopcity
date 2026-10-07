import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/products': 'http://localhost:3000',
      '/reviews': 'http://localhost:3000',
      '/cart': 'http://localhost:3000',
      '/orders': 'http://localhost:3000',
      '/checkout': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/register': 'http://localhost:3000',
      '/login': 'http://localhost:3000',
      '/logout': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
    }
  }
});