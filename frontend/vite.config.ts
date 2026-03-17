import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://backend:3000',
          changeOrigin: true,
        },
        '/chat_api': {
          target: 'http://chatbot:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/chat_api/, '')
        },
        '/uploads': {
          target: 'http://backend:3000',
          changeOrigin: true
        }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
