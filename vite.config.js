import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isElectron = process.env.ELECTRON === 'true';

export default defineConfig({
  plugins: [react()],
  base: isElectron ? './' : '/',
  server: {
    proxy: {
      '/api/livekit-token': 'http://localhost:3000',
    },
  },
});
