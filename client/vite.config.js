import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // lets you open the app from a phone on the same Wi-Fi
    port: 5173,
    proxy: {
      // In development the API is reached through Vite, so VITE_API_URL can stay empty.
      '/api': 'http://localhost:5000',
    },
  },
});
