import { defineConfig } from 'vite';

export default defineConfig({
  base: '/image-compressor/',
  build: {
    rollupOptions: {
      input: {
        'image-compressor': 'image-compressor.html',
        privacy: 'privacy.html',
      },
    },
  },
});
