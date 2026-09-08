import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  plugins: [
    {
      name: 'emit-root-index',
      enforce: 'post',
      generateBundle(_options, bundle) {
        const appEntry = bundle['image-compressor.html'];

        if (!appEntry || appEntry.type !== 'asset') {
          this.error('Unable to emit index.html: image-compressor.html is missing.');
        }

        this.emitFile({
          type: 'asset',
          fileName: 'index.html',
          source: appEntry.source,
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        'image-compressor': 'image-compressor.html',
        privacy: 'privacy.html',
      },
    },
  },
});
