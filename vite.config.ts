import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base:"https://JosueUAB.github.io/frontend_project_diplomado",
  server: {
    proxy: {
      '/tasks': {
        // target: 'http://localhost:3000',
        target: 'https://backend-project-diplomado.onrender.com/',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

