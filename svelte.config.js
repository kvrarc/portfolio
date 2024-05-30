import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      // Define aliases for component paths
      '@components': path.resolve(new URL('.', import.meta.url).pathname, './src/components/')
    }
  }
});
