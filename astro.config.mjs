import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gaschampion.co.uk',
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    css: {
      postcss: './postcss.config.cjs',
    },
  },
});
