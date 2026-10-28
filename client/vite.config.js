import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // listen on IPv4 and IPv6 so localhost and 127.0.0.1 both work
    // Forward API calls to the Express server during development.
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
});
