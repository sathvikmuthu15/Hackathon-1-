import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// HTTPS is needed for camera, microphone and location on a phone.
// `npm run dev` serves the client over a self-signed cert on your LAN
// and proxies /api to the Express server, so the AI key never reaches the browser.
const apiPort = process.env.PORT || 8787;

export default defineConfig({
  root: 'client',
  plugins: [basicSsl()],
  server: {
    host: true,
    port: 5173,
    proxy: { '/api': `http://localhost:${apiPort}` },
  },
  build: { outDir: '../dist', emptyOutDir: true },
});
