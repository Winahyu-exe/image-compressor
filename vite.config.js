import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        'image-compressor': 'image-compressor.html',
        privacy: 'privacy.html',
      },
    },
  },
});
